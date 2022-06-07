import { ParamType } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { MaxUint256 } from "@ethersproject/constants";
import { CallOverrides, Contract, PopulatedTransaction } from "@ethersproject/contracts";
import { JsonRpcSigner, TransactionRequest, TransactionResponse } from "@ethersproject/providers";

// import { CachedFetcher } from "../cache";
import { ChainId, isEthereum } from "../chain";
import { ContractAddressId, ServiceInterface } from "../common";
import { chunkArray, isNativeToken } from "../helpers";
import {
  Address,
  Apy,
  Balance,
  Gauge,
  GaugeDynamic,
  GaugeMetadata,
  GaugeStatic,
  GaugeUserMetadata,
  GaugeUserSummary,
  Integer,
  Position,
  SdkError,
  Token,
  TokenAllowance,
  TypeId,
  WriteTransactionProps,
  WriteTransactionResult,
} from "../types";
import { keyBy, toBN, toUnit, USDC_DECIMALS } from "../utils";

const GaugeAbi = [
  "function deposit(uint256 _amount) external returns (bool)",
  "function withdraw(uint256 _amount, bool _claim, bool _lock) external returns (bool)",
  "function getReward() external returns (bool)",
];

const GaugeRegistryAbi = [
  "function getVaults() public view returns (address[] memory)",
  "function gauges(address _addr) public view returns (address)",
];

export class GaugeInterface<T extends ChainId> extends ServiceInterface<T> {
  /**
   * Get all Gauges
   * @param addresses filter, if not provided, all are returned
   * @returns Gauge array
   */
  async get({ addresses }: { addresses?: Address[] }): Promise<Gauge[]> {
    const supportedAddresses = await this.getSupportedAddresses({ addresses });
    const staticData = await this.getStatic({ addresses: supportedAddresses });
    const dynamicData = await this.getDynamic({ addresses: supportedAddresses });
    const staticDataMap = keyBy(staticData, "address");
    const dynamicDataMap = keyBy(dynamicData, "address");
    const gauges: Gauge[] = supportedAddresses.map((address) => ({
      ...staticDataMap[address],
      ...dynamicDataMap[address],
    }));

    return gauges;
  }

  /**
   * Get static properties of Gauges
   * @param addresses filter, if not provided, all are returned
   * @returns GaugeStatic array
   */
  async getStatic({ addresses }: { addresses?: Address[] }): Promise<GaugeStatic[]> {
    const supportedAddresses = await this.getSupportedAddresses({ addresses });
    const gaugeProperties = ["address stakingToken"].map((prop) => ParamType.from(prop));
    const vaultProperties = ["string name", "string version", "string symbol", "uint256 decimals"].map((prop) =>
      ParamType.from(prop)
    );
    const staticDataPromises = supportedAddresses.map(async (address) => {
      const { stakingToken } = await this.yearn.services.propertiesAggregator.getProperties(address, gaugeProperties);
      const { name, version, symbol, decimals } = await this.yearn.services.propertiesAggregator.getProperties(
        stakingToken as string,
        vaultProperties
      );
      const staticData: GaugeStatic = {
        address,
        typeId: "GAUGE",
        token: stakingToken as Address,
        name: name as string,
        version: version as string,
        symbol: symbol as string,
        decimals: (decimals as BigNumber).toString(),
      };
      return staticData;
    });
    return Promise.all(staticDataPromises);
  }

  /**
   * Get dynamic properties of Gauges
   * @param addresses filter, if not provided, all are returned
   * @returns GaugeDynamic array
   */
  async getDynamic({ addresses }: { addresses?: Address[] }): Promise<GaugeDynamic[]> {
    const supportedAddresses = await this.getSupportedAddresses({ addresses });
    const gaugeProperties = ["address stakingToken", "uint256 totalSupply"].map((prop) => ParamType.from(prop));
    const gaugesDataPromises = supportedAddresses.map(async (address) => {
      const { stakingToken, totalSupply } = await this.yearn.services.propertiesAggregator.getProperties(
        address,
        gaugeProperties
      );
      return {
        address,
        vaultAddress: stakingToken as Address,
        totalStaked: (totalSupply as BigNumber).toString(),
      };
    });
    const gaugesData = await Promise.all(gaugesDataPromises);
    const vaultAddresses = gaugesData.map(({ vaultAddress }) => vaultAddress);
    const vaults = await this.yearn.vaults.get(vaultAddresses);
    const vaultsMap = keyBy(vaults, "address");
    const underlyingTokens = vaults.map(({ token }) => token);
    const gaugesDataMap = keyBy(gaugesData, "address");
    const tokenPrices = await this.yearn.services.helper.tokenPrices(underlyingTokens);
    const tokenPricesMap = keyBy(tokenPrices, "address");
    const dynamicData = supportedAddresses.map((address) => {
      const { vaultAddress, totalStaked } = gaugesDataMap[address];
      const { token, decimals, metadata } = vaultsMap[vaultAddress];
      const { priceUsdc } = tokenPricesMap[token];
      const amount = totalStaked;
      const underlyingTokenAmount = toBN(amount)
        .times(toUnit({ amount: metadata.pricePerShare, decimals: parseInt(decimals) }))
        .toFixed(0);
      const underlyingTokenBalance = {
        amount,
        amountUsdc: toBN(underlyingTokenAmount)
          .times(toUnit({ amount: priceUsdc, decimals: USDC_DECIMALS }))
          .toFixed(0),
      };
      const dynamicData: GaugeDynamic = {
        address,
        typeId: "GAUGE",
        tokenId: vaultAddress as Address,
        underlyingTokenBalance,
        metadata: {
          // TODO: get apy
          displayIcon: metadata.displayIcon,
          displayName: metadata.displayName,
          vaultPricePerShare: metadata.pricePerShare,
          vaultUnderlyingToken: token,
        },
      };
      return dynamicData;
    });
    return dynamicData;
  }

  /**
   * Get all Gauge positions of an account
   * @param accountAddress user wallet address
   * @param addresses filter, if not provided, all are returned
   * @returns Position array
   */
  async positionsOf({ account, addresses }: { account: Address; addresses?: Address[] }): Promise<Position[]> {
    const gauges = await this.get({ addresses });
    const gaugeAddresses = gauges.map(({ address }) => address);
    const underlyingTokenAddresses = gauges.map(({ metadata }) => metadata.vaultUnderlyingToken);
    const gaugeBalances = await this.yearn.services.helper.tokenBalances(account, gaugeAddresses);
    const gaugeBalancesMap = keyBy(gaugeBalances, "address");
    const tokenPrices = await this.yearn.services.helper.tokenPrices(underlyingTokenAddresses);
    const tokenPricesMap = keyBy(tokenPrices, "address");
    // TODO: add YIELD position based on rewards
    const positionsPromises = gauges.map(async ({ address, token, decimals, metadata }) => {
      const { balance } = gaugeBalancesMap[address];
      const { priceUsdc } = tokenPricesMap[metadata.vaultUnderlyingToken];
      const underlyingTokenAmount = toBN(balance)
        .times(toUnit({ amount: metadata.vaultPricePerShare, decimals: parseInt(decimals) }))
        .toFixed(0);
      const underlyingTokenBalance = {
        amount: underlyingTokenAmount,
        amountUsdc: toBN(underlyingTokenAmount)
          .times(toUnit({ amount: priceUsdc, decimals: USDC_DECIMALS }))
          .toFixed(0),
      };
      const position: Position = {
        assetAddress: address,
        tokenAddress: token,
        typeId: "DEPOSIT",
        balance,
        underlyingTokenBalance,
        assetAllowances: [],
        tokenAllowances: [],
      };
      return position;
    });
    return Promise.all(positionsPromises);
  }

  /**
   * Get the Gauge user summary of an account
   * @param accountAddress user wallet address
   * @returns GaugeUserSummary
   */
  async summaryOf({ account }: { account: Address }): Promise<GaugeUserSummary> {
    console.log(account);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Get all Gauge metadata of an account
   * @param accountAddress user wallet address
   * @param addresses filter, if not provided, all are returned
   * @returns GaugeUserMetadata array
   */
  async metadataOf({ account, addresses }: { account: Address; addresses?: Address[] }): Promise<GaugeUserMetadata[]> {
    console.log(account, addresses);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Get all Gauge underlying token balances of an account
   * @param accountAddress user wallet address
   * @param addresses filter, if not provided, all are returned
   * @returns Balance array
   */
  async balances({ account, addresses }: { account: Address; addresses?: Address[] }): Promise<Balance[]> {
    console.log(account, addresses);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Get all Gauge underlying tokens
   * @param addresses filter, if not provided, all are returned
   * @returns Token array
   */
  async tokens({ addresses }: { addresses?: Address[] }): Promise<Token[]> {
    console.log(addresses);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Stake an amount of tokens into a Gauge
   * @param accountAddress
   * @param tokenAddress
   * @param votingEscrowAddress
   * @param amount
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async stake<P extends WriteTransactionProps>(props: P): WriteTransactionResult<P>;
  async stake({
    accountAddress,
    votingEscrowAddress,
    amount,
    populate,
    overrides = {},
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    votingEscrowAddress: Address;
    amount: Integer;
    populate?: boolean;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse | PopulatedTransaction> {
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const gaugeContract = new Contract(votingEscrowAddress, GaugeAbi, signer);
    const tx = await gaugeContract.populateTransaction.deposit(amount, overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Unstake an amount of tokens from a Gauge
   * @param accountAddress
   * @param votingEscrowAddress
   * @param amount
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async unstake<P extends WriteTransactionProps>(props: P): WriteTransactionResult<P>;
  async unstake({
    accountAddress,
    votingEscrowAddress,
    amount,
    populate,
    overrides = {},
  }: {
    accountAddress: Address;
    votingEscrowAddress: Address;
    amount: Integer;
    populate?: boolean;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse | PopulatedTransaction> {
    const claim = false;
    const lock = false;
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const gaugeContract = new Contract(votingEscrowAddress, GaugeAbi, signer);
    const tx = await gaugeContract.populateTransaction.withdraw(amount, claim, lock, overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Claim reward tokens from a Gauge
   * @param accountAddress
   * @param votingEscrowAddress
   * @param amount
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async claimRewards<P extends WriteTransactionProps>(props: P): WriteTransactionResult<P>;
  async claimRewards({
    accountAddress,
    votingEscrowAddress,
    populate,
    overrides = {},
  }: {
    accountAddress: Address;
    votingEscrowAddress: Address;
    populate?: boolean;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse | PopulatedTransaction> {
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const gaugeContract = new Contract(votingEscrowAddress, GaugeAbi, signer);
    const tx = await gaugeContract.populateTransaction.getReward(overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  private async getSupportedAddresses({ addresses }: { addresses?: Address[] }): Promise<Address[]> {
    const gaugeRegistryAddress = await this.yearn.addressProvider.addressById(ContractAddressId.gaugeRegistry);
    const gaugeRegistryContract = new Contract(gaugeRegistryAddress, GaugeRegistryAbi, this.ctx.provider.read);
    const vaultAddresses: Address[] = await gaugeRegistryContract.getVaults();
    const gaugesAddressesPromises = vaultAddresses.map(async (address) => {
      const gaugeAddress: Address = await gaugeRegistryContract.gauges(address);
      return gaugeAddress;
    });
    const gaugeAddresses = await Promise.all(gaugesAddressesPromises);
    const supportedAddresses = addresses
      ? addresses.filter((address) => gaugeAddresses.includes(address))
      : gaugeAddresses;
    return supportedAddresses;
  }
}
