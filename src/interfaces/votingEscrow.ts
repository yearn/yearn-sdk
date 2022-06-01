import { ParamType } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
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
  Integer,
  Position,
  SdkError,
  Token,
  TokenAllowance,
  TypeId,
  VotingEscrow,
  VotingEscrowDynamic,
  VotingEscrowMetadata,
  VotingEscrowStatic,
  VotingEscrowUserMetadata,
  VotingEscrowUserSummary,
} from "../types";
import { keyBy, toBN, toUnit, USDC_DECIMALS } from "../utils";

const VotingEscrowAbi = [
  "function create_lock(uint256 _value, uint256 _unlock_time) public",
  "function increase_amount(uint256 _value) public",
  "function increase_unlock_time(uint256 _unlock_time) public",
  "function withdraw() public",
  "function force_withdraw() public",
  "function locked(address arg0) public view returns (tuple(uint128 amount, uint256 end))",
  "function locked__end(address _addr) public view returns (uint256)",
  "function balanceOf(address addr) public view returns (uint256)",
];

const GaugeRegistryAbi = ["function veToken() public view returns (address)"];

export class VotingEscrowInterface<T extends ChainId> extends ServiceInterface<T> {
  /**
   * Get all Voting Escrow assets
   * @param addresses filter, if not provided, all are returned
   * @returns VotingEscrow array
   */
  async get({ addresses }: { addresses?: Address[] }): Promise<VotingEscrow[]> {
    const supportedAddresses = await this.getSupportedAddresses({ addresses });
    const staticData = await this.getStatic({ addresses: supportedAddresses });
    const dynamicData = await this.getDynamic({ addresses: supportedAddresses });
    const staticDataMap = keyBy(staticData, "address");
    const dynamicDataMap = keyBy(dynamicData, "address");
    const votingEscrows: VotingEscrow[] = supportedAddresses.map((address) => ({
      ...staticDataMap[address],
      ...dynamicDataMap[address],
    }));

    return votingEscrows;
  }

  /**
   * Get static properties of Voting Escrows
   * @param addresses filter, if not provided, all are returned
   * @returns VotingEscrowStatic array
   */
  async getStatic({ addresses }: { addresses?: Address[] }): Promise<VotingEscrowStatic[]> {
    const supportedAddresses = await this.getSupportedAddresses({ addresses });
    const properties = ["address token", "string name", "string version", "string symbol", "uint256 decimals"].map(
      (prop) => ParamType.from(prop)
    );
    const staticDataPromises = supportedAddresses.map(async (address) => {
      const { token, name, version, symbol, decimals } = await this.yearn.services.propertiesAggregator.getProperties(
        address,
        properties
      );
      const staticData: VotingEscrowStatic = {
        address,
        typeId: "VOTING_ESCROW",
        token: token as Address,
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
   * Get dynamic properties of Voting Escrows
   * @param addresses filter, if not provided, all are returned
   * @returns VotingEscrowDynamic array
   */
  async getDynamic({ addresses }: { addresses?: Address[] }): Promise<VotingEscrowDynamic[]> {
    const supportedAddresses = await this.getSupportedAddresses({ addresses });
    const properties = ["address token", "uint256 supply"].map((prop) => ParamType.from(prop));
    const dynamicDataPromises = supportedAddresses.map(async (address) => {
      const { token, supply } = await this.yearn.services.propertiesAggregator.getProperties(address, properties);
      const amount = (supply as BigNumber).toString();
      const priceUsdc = await this.yearn.services.oracle.getPriceUsdc(token as Address);
      const underlyingTokenBalance = {
        amount,
        amountUsdc: toBN(amount)
          .times(toUnit({ amount: priceUsdc, decimals: USDC_DECIMALS }))
          .toFixed(0),
      };
      const dynamicData: VotingEscrowDynamic = {
        address,
        typeId: "VOTING_ESCROW",
        tokenId: token as Address,
        underlyingTokenBalance,
        metadata: {}, // TODO: get apy
      };
      return dynamicData;
    });
    return Promise.all(dynamicDataPromises);
  }

  /**
   * Get all Voting Escrows positions of an account
   * @param accountAddress user wallet address
   * @param addresses filter, if not provided, all are returned
   * @returns Position array
   */
  async positionsOf({ account, addresses }: { account: Address; addresses?: Address[] }): Promise<Position[]> {
    const votingEscrows = await this.get({ addresses });
    const votingEscrowAddresses = votingEscrows.map(({ address }) => address);
    const underlyingTokens = votingEscrows.map(({ token }) => token);
    const tokenBalances = await this.yearn.services.helper.tokenBalances(account, votingEscrowAddresses);
    const tokenBalancesMap = keyBy(tokenBalances, "address");
    const tokenPrices = await this.yearn.services.helper.tokenPrices(underlyingTokens);
    const tokenPricesMap = keyBy(tokenPrices, "address");
    // TODO: add YIELD position based on rewards
    // const properties = ["address reward_pool"].map((prop) => ParamType.from(prop));
    const positionsPromises = votingEscrows.map(async ({ address, token }) => {
      // const { reward_pool: rewardPool } = await this.yearn.services.propertiesAggregator.getProperties(
      //   address,
      //   properties
      // );
      const balance = tokenBalancesMap[address].balance;
      const priceUsdc = tokenPricesMap[token].priceUsdc;
      const votingEscrowContract = new Contract(address, VotingEscrowAbi, this.ctx.provider.read);
      const locked = await votingEscrowContract.locked(account);
      const amount = (locked.amount as BigNumber).toString();
      const underlyingTokenBalance = {
        amount,
        amountUsdc: toBN(amount)
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
   * Get the Voting Escrow user summary of an account
   * @param accountAddress user wallet address
   * @returns VotingEscrowUserSummary
   */
  async summaryOf({ account }: { account: Address }): Promise<VotingEscrowUserSummary> {
    console.log(account);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Get all Voting Escrows metadata of an account
   * @param accountAddress user wallet address
   * @param addresses filter, if not provided, all are returned
   * @returns VotingEscrowUserMetadata array
   */
  async metadataOf({
    account,
    addresses,
  }: {
    account: Address;
    addresses?: Address[];
  }): Promise<VotingEscrowUserMetadata[]> {
    console.log(account, addresses);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Get all Voting Escrows underlying token balances of an account
   * @param accountAddress user wallet address
   * @param addresses filter, if not provided, all are returned
   * @returns Balance array
   */
  async balances({ account, addresses }: { account: Address; addresses?: Address[] }): Promise<Balance[]> {
    console.log(account, addresses);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Get all Voting Escrows underlying tokens
   * @param addresses filter, if not provided, all are returned
   * @returns Token array
   */
  async tokens({ addresses }: { addresses?: Address[] }): Promise<Token[]> {
    console.log(addresses);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Fetch the token amount that has been allowed to be used to lock
   * @param accountAddress
   * @param tokenAddress
   * @param votingEscrowAddress
   * @returns TokenAllowance
   */
  async getLockAllowance({
    accountAddress,
    tokenAddress,
    votingEscrowAddress,
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    votingEscrowAddress: Address;
  }): Promise<TokenAllowance> {
    console.log(accountAddress, tokenAddress, votingEscrowAddress);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Approve the token amount to allow to be used to lock
   * @param accountAddress
   * @param tokenAddress
   * @param votingEscrowAddress
   * @param amount
   * @param overrides
   * @returns TransactionResponse
   */
  async approveLock({
    accountAddress,
    tokenAddress,
    votingEscrowAddress,
    amount,
    overrides = {},
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    votingEscrowAddress: Address;
    amount?: Integer;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse> {
    console.log(accountAddress, tokenAddress, votingEscrowAddress, amount, overrides);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Lock an amount of tokens into a Voting Escrow for the specified amount of time
   * @param accountAddress
   * @param tokenAddress
   * @param votingEscrowAddress
   * @param amount
   * @param time In weeks
   * @param overrides
   * @returns transaction
   */
  async lock({
    accountAddress,
    tokenAddress,
    votingEscrowAddress,
    amount,
    time,
    overrides = {},
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    votingEscrowAddress: Address;
    amount: Integer;
    time: number;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse> {
    console.log(accountAddress, tokenAddress, votingEscrowAddress, amount, time, overrides);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Increase the amount of tokens locked on the Voting Escrow
   * @param accountAddress
   * @param tokenAddress
   * @param votingEscrowAddress
   * @param amount
   * @param time In weeks
   * @param overrides
   * @returns transaction
   */
  async increaseLockAmount({
    accountAddress,
    tokenAddress,
    votingEscrowAddress,
    amount,
    overrides = {},
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    votingEscrowAddress: Address;
    amount: Integer;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse> {
    console.log(accountAddress, tokenAddress, votingEscrowAddress, amount, overrides);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Extend the time to lock the tokens on the Voting Escrow
   * @param accountAddress
   * @param tokenAddress
   * @param votingEscrowAddress
   * @param time In weeks
   * @param overrides
   * @returns transaction
   */
  async extendLockTime({
    accountAddress,
    tokenAddress,
    votingEscrowAddress,
    time,
    overrides = {},
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    votingEscrowAddress: Address;
    amount: Integer;
    time: number;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse> {
    console.log(accountAddress, tokenAddress, votingEscrowAddress, time, overrides);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Withdraw unlocked tokens from Voting Escrow
   * @param accountAddress
   * @param votingEscrowAddress
   * @param overrides
   * @returns transaction
   */
  async withdrawUnlocked({
    accountAddress,
    votingEscrowAddress,
    overrides = {},
  }: {
    accountAddress: Address;
    votingEscrowAddress: Address;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse> {
    console.log(accountAddress, votingEscrowAddress, overrides);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Withdraw locked tokens from Voting Escrow with a penalty
   * @param accountAddress
   * @param votingEscrowAddress
   * @param overrides
   * @returns transaction
   */
  async withdrawLocked({
    accountAddress,
    votingEscrowAddress,
    overrides = {},
  }: {
    accountAddress: Address;
    votingEscrowAddress: Address;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse> {
    console.log(accountAddress, votingEscrowAddress, overrides);
    throw new Error("NOT IMPLEMENTED");
  }

  // claimReward

  private async getSupportedAddresses({ addresses }: { addresses?: Address[] }): Promise<Address[]> {
    const gaugeRegistryAddress = await this.yearn.addressProvider.addressById(ContractAddressId.gaugeRegistry);
    const gaugeRegistryContract = new Contract(gaugeRegistryAddress, GaugeRegistryAbi, this.ctx.provider.read);
    const veTokenAddress = await gaugeRegistryContract.veToken();
    const votingEscrowAddresses = [veTokenAddress];
    const supportedAddresses = addresses
      ? addresses.filter((address) => votingEscrowAddresses.includes(address))
      : votingEscrowAddresses;
    return supportedAddresses;
  }
}
