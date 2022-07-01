import { ParamType } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { MaxUint256 } from "@ethersproject/constants";
import { Contract, PopulatedTransaction } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/providers";

import { ChainId } from "../chain";
import { ContractAddressId, ServiceInterface } from "../common";
import {
  Address,
  Balance,
  Gauge,
  GaugeDynamic,
  GaugeStatic,
  GaugeUserMetadata,
  Integer,
  Position,
  Token,
  TokenAllowance,
  WriteTransactionProps,
  WriteTransactionResult,
} from "../types";
import { keyBy, toBN, toUnit, USDC_DECIMALS } from "../utils";

const DAY = 86400; // in seconds
const YEAR = DAY * 365;

const GaugeAbi = [
  "function earned(address _account) public view returns (uint256)",
  "function boostedBalanceOf(address _account) public view returns (uint256)",
  "function deposit(uint256 _amount) external returns (bool)",
  "function withdraw(uint256 _amount, bool _claim, bool _lock) external returns (bool)",
  "function getReward() external returns (bool)",
];

const GaugeRegistryAbi = [
  "function getVaults() public view returns (address[] memory)",
  "function gauges(address _addr) public view returns (address)",
];

const ClaimRewardsZapAbi = ["function claim(address[] calldata , bool _lock, bool _claimVeYfi) external"];

interface ApproveStakeProps extends WriteTransactionProps {
  accountAddress: Address;
  tokenAddress: Address;
  gaugeAddress: Address;
  amount?: Integer;
}

interface StakeProps extends WriteTransactionProps {
  accountAddress: Address;
  tokenAddress: Address;
  gaugeAddress: Address;
  amount: Integer;
}

interface UnstakeProps extends WriteTransactionProps {
  accountAddress: Address;
  gaugeAddress: Address;
  amount: Integer;
}

interface ClaimRewardsProps extends WriteTransactionProps {
  accountAddress: Address;
  gaugeAddress: Address;
}

interface ClaimAllRewardsProps extends WriteTransactionProps {
  accountAddress: Address;
  addresses?: Address[];
  claimVotingEscrow?: boolean;
}

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
    const gaugeProperties = [
      "address stakingToken",
      "uint256 totalSupply",
      "address rewardToken",
      "uint256 rewardRate",
      "address veToken",
    ].map((prop) => ParamType.from(prop));
    const gaugesDataPromises = supportedAddresses.map(async (address) => {
      const { stakingToken, totalSupply, rewardToken, rewardRate, veToken } =
        await this.yearn.services.propertiesAggregator.getProperties(address, gaugeProperties);
      return {
        address,
        vaultAddress: stakingToken as Address,
        totalStaked: (totalSupply as BigNumber).toString(),
        rewardToken: rewardToken as Address,
        rewardRate: (rewardRate as BigNumber).toString(),
        votingEscrowToken: veToken as Address,
      };
    });
    const gaugesData = await Promise.all(gaugesDataPromises);
    const gaugesDataMap = keyBy(gaugesData, "address");
    const rewardTokenAddresses = gaugesData.map(({ rewardToken }) => rewardToken);
    const uniqueRewardTokenAddresses = [...new Set(rewardTokenAddresses)];
    const vaultAddresses = gaugesData.map(({ vaultAddress }) => vaultAddress);
    const vaults = await this.yearn.vaults.get(vaultAddresses);
    const vaultsMap = keyBy(vaults, "address");
    const underlyingTokenAddresses = vaults.map(({ token }) => token);
    const tokenPrices = await this.yearn.services.helper.tokenPrices([
      ...underlyingTokenAddresses,
      ...uniqueRewardTokenAddresses,
    ]);
    const tokenPricesMap = keyBy(tokenPrices, "address");
    const dynamicData = supportedAddresses.map((address) => {
      const { vaultAddress, totalStaked, rewardToken, rewardRate, votingEscrowToken } = gaugesDataMap[address];
      const { token, decimals, metadata } = vaultsMap[vaultAddress];
      const { priceUsdc } = tokenPricesMap[token];
      const rewardPriceUsdc = tokenPricesMap[rewardToken].priceUsdc;
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
      const rewardUsdc = toBN(rewardRate)
        .times(toUnit({ amount: rewardPriceUsdc, decimals: USDC_DECIMALS }))
        .toFixed(0);
      const apy = toBN(rewardUsdc).times(YEAR).dividedBy(underlyingTokenBalance.amountUsdc).toNumber();
      const dynamicData: GaugeDynamic = {
        address,
        typeId: "GAUGE",
        tokenId: vaultAddress,
        underlyingTokenBalance,
        metadata: {
          apy,
          displayIcon: metadata.displayIcon,
          displayName: metadata.displayName,
          vaultPricePerShare: metadata.pricePerShare,
          vaultUnderlyingToken: token,
          rewardToken,
          votingEscrowToken,
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
  async positionsOf({
    accountAddress,
    addresses,
  }: {
    accountAddress: Address;
    addresses?: Address[];
  }): Promise<Position[]> {
    const gauges = await this.get({ addresses });
    const gaugeAddresses = gauges.map(({ address }) => address);
    const underlyingTokenAddresses = gauges.map(({ metadata }) => metadata.vaultUnderlyingToken);
    const rewardTokenAddresses = gauges.map(({ metadata }) => metadata.rewardToken);
    const uniqueRewardTokenAddresses = [...new Set(rewardTokenAddresses)];
    const gaugeBalances = await this.yearn.services.helper.tokenBalances(accountAddress, gaugeAddresses);
    const gaugeBalancesMap = keyBy(gaugeBalances, "address");
    const tokenPrices = await this.yearn.services.helper.tokenPrices([
      ...underlyingTokenAddresses,
      ...uniqueRewardTokenAddresses,
    ]);
    const tokenPricesMap = keyBy(tokenPrices, "address");
    const positionsPromises = gauges.map(async ({ address, token, decimals, metadata }) => {
      const { balance } = gaugeBalancesMap[address];
      const underlyingTokenPriceUsdc = tokenPricesMap[metadata.vaultUnderlyingToken].priceUsdc;
      const underlyingTokenAmount = toBN(balance)
        .times(toUnit({ amount: metadata.vaultPricePerShare, decimals: parseInt(decimals) }))
        .toFixed(0);
      const depositPosition: Position = {
        assetAddress: address,
        tokenAddress: token,
        typeId: "DEPOSIT",
        balance,
        underlyingTokenBalance: {
          amount: underlyingTokenAmount,
          amountUsdc: toBN(underlyingTokenAmount)
            .times(toUnit({ amount: underlyingTokenPriceUsdc, decimals: USDC_DECIMALS }))
            .toFixed(0),
        },
        assetAllowances: [],
        tokenAllowances: [],
      };
      const gaugeContract = new Contract(address, GaugeAbi, this.ctx.provider.read);
      const earned = await gaugeContract.earned(accountAddress);
      const rewardBalance = earned.toString();
      const rewardTokenPriceUsdc = tokenPricesMap[metadata.vaultUnderlyingToken].priceUsdc;
      const yieldPosition: Position = {
        assetAddress: address,
        tokenAddress: metadata.rewardToken,
        typeId: "YIELD",
        balance: rewardBalance,
        underlyingTokenBalance: {
          amount: rewardBalance,
          amountUsdc: toBN(rewardBalance)
            .times(toUnit({ amount: rewardTokenPriceUsdc, decimals: USDC_DECIMALS }))
            .toFixed(0),
        },
        assetAllowances: [],
        tokenAllowances: [],
      };
      return [depositPosition, yieldPosition];
    });
    const positions = await Promise.all(positionsPromises);
    return positions.flat().filter(({ balance }) => toBN(balance).gt(0));
  }

  /**
   * Get the Gauges user metadata of an account
   * @param accountAddress
   * @param addresses filter, if not provided, all are returned
   * @returns
   */
  async metadataOf({
    accountAddress,
    addresses,
  }: {
    accountAddress: Address;
    addresses?: Address[];
  }): Promise<GaugeUserMetadata[]> {
    const gauges = await this.get({ addresses });
    const votingEscrowsAddresses = gauges.map(({ metadata }) => metadata.votingEscrowToken);
    const uniqueVotingEscrowsAddresses = [...new Set(votingEscrowsAddresses)];
    const votingEscrows = await this.yearn.votingEscrows.get({ addresses: uniqueVotingEscrowsAddresses });
    const votingEscrowsMap = keyBy(votingEscrows, "address");
    const gaugesPositions = await this.positionsOf({ accountAddress, addresses });
    const gaugesStakedPositions = gaugesPositions.filter(({ typeId }) => typeId === "DEPOSIT");
    const gaugesStakedPositionsMap = keyBy(gaugesStakedPositions, "assetAddress");
    const votingEscrowPositions = await this.yearn.votingEscrows.positionsOf({
      accountAddress,
      addresses: uniqueVotingEscrowsAddresses,
    });
    const votingEscrowLockedPositions = votingEscrowPositions.filter(({ typeId }) => typeId === "DEPOSIT");
    const votingEscrowLockedPositionsMap = keyBy(votingEscrowLockedPositions, "assetAddress");
    const userMetadataPromises = gauges.map(async ({ address, underlyingTokenBalance, metadata }) => {
      const totalStakedInGauge = underlyingTokenBalance.amount;
      const accountStakedInGauge = gaugesStakedPositionsMap[address]?.underlyingTokenBalance.amount ?? "0";
      const totalLockedInVotingEscrow = votingEscrowsMap[metadata.votingEscrowToken].underlyingTokenBalance.amount;
      const accountLockedInVotingEscrow =
        votingEscrowLockedPositionsMap[metadata.votingEscrowToken]?.underlyingTokenBalance.amount ?? "0";
      const calculatedBoostedBalance = toBN(accountStakedInGauge)
        .times(0.1)
        .plus(
          toBN(totalStakedInGauge).times(toBN(accountLockedInVotingEscrow).div(totalLockedInVotingEscrow)).times(0.9)
        );
      const calculatedBoostRatio = toBN(accountStakedInGauge).gt(0)
        ? calculatedBoostedBalance.div(accountStakedInGauge).toNumber()
        : 0.1;
      const calculatedBoost = Math.min(1, calculatedBoostRatio) * 10;

      const gaugeContract = new Contract(address, GaugeAbi, this.ctx.provider.read);
      const boostedBalance = await gaugeContract.boostedBalanceOf(accountAddress);
      const boostRatio = toBN(accountStakedInGauge).gt(0)
        ? toBN((boostedBalance as BigNumber).toString())
            .div(accountStakedInGauge)
            .toNumber()
        : 0.1;
      const boost = Math.min(1, boostRatio) * 10;

      return {
        assetAddress: address,
        boost,
        _calculatedBoost: calculatedBoost, // TODO remove after confirm most accurate calc for boost
      };
    });

    return Promise.all(userMetadataPromises);
  }

  /**
   * Get all Gauge underlying token balances of an account
   * @param accountAddress user wallet address
   * @param addresses filter, if not provided, all are returned
   * @returns Balance array
   */
  async balances({
    accountAddress,
    addresses,
  }: {
    accountAddress: Address;
    addresses?: Address[];
  }): Promise<Balance[]> {
    const gauges = await this.get({ addresses });
    const vaultsAddresses = gauges.map(({ token }) => token);
    const tokens = await this.yearn.services.helper.tokens(vaultsAddresses);
    const tokensMap = keyBy(tokens, "address");
    const tokenBalances = await this.yearn.services.helper.tokenBalances(accountAddress, vaultsAddresses);
    const tokenBalancesMap = keyBy(tokenBalances, "address");
    const balances = vaultsAddresses.map((address) => {
      const { balance, balanceUsdc, priceUsdc } = tokenBalancesMap[address];
      const token = tokensMap[address];
      return {
        address: accountAddress,
        token,
        balance,
        balanceUsdc,
        priceUsdc,
      };
    });
    return balances;
  }

  /**
   * Get all Gauge underlying tokens
   * @param addresses filter, if not provided, all are returned
   * @returns Token array
   */
  async tokens({ addresses }: { addresses?: Address[] }): Promise<Token[]> {
    const gauges = await this.get({ addresses });
    const vaultAddresses = gauges.map(({ token }) => token);
    const tokens = await this.yearn.services.helper.tokens(vaultAddresses);
    const tokensMap = keyBy(tokens, "address");
    const icons = await this.yearn.services.asset.icon(vaultAddresses);
    const tokenPrices = await this.yearn.services.helper.tokenPrices(vaultAddresses);
    const tokenPricesMap = keyBy(tokenPrices, "address");
    const tokensMetadata = await this.yearn.tokens.metadata(vaultAddresses);
    const tokensMetadataMap = keyBy(tokensMetadata, "address");
    const underlyingTokens: Token[] = vaultAddresses.map((address) => {
      return {
        ...tokensMap[address],
        icon: icons[address],
        priceUsdc: tokenPricesMap[address].priceUsdc,
        dataSource: "gauges",
        supported: {
          gauges: true,
        },
        metadata: tokensMetadataMap[address],
      };
    });
    return underlyingTokens;
  }

  /**
   * Fetch the token amount that has been allowed to be used to stake
   * @param accountAddress
   * @param tokenAddress
   * @param gaugeAddress
   * @returns TokenAllowance
   */
  async getStakeAllowance({
    accountAddress,
    tokenAddress,
    gaugeAddress,
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    gaugeAddress: Address;
  }): Promise<TokenAllowance> {
    return this.yearn.tokens.allowance(accountAddress, tokenAddress, gaugeAddress);
  }

  /**
   * Approve the token amount to allow to be used to stake
   * @param accountAddress
   * @param tokenAddress
   * @param gaugeAddress
   * @param amount
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async approveStake<P extends ApproveStakeProps>(props: P): WriteTransactionResult<P>;
  async approveStake({
    accountAddress,
    tokenAddress,
    gaugeAddress,
    amount,
    populate,
    overrides = {},
  }: ApproveStakeProps): Promise<TransactionResponse | PopulatedTransaction> {
    const tx = await this.yearn.tokens.populateApprove(
      accountAddress,
      tokenAddress,
      gaugeAddress,
      amount ?? MaxUint256.toString(),
      overrides
    );

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Stake an amount of tokens into a Gauge
   * @param accountAddress
   * @param tokenAddress
   * @param gaugeAddress
   * @param amount
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async stake<P extends StakeProps>(props: P): WriteTransactionResult<P>;
  async stake({
    accountAddress,
    gaugeAddress,
    amount,
    populate,
    overrides = {},
  }: StakeProps): Promise<TransactionResponse | PopulatedTransaction> {
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const gaugeContract = new Contract(gaugeAddress, GaugeAbi, signer);
    const tx = await gaugeContract.populateTransaction.deposit(amount, overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Unstake an amount of tokens from a Gauge
   * @param accountAddress
   * @param gaugeAddress
   * @param amount
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async unstake<P extends UnstakeProps>(props: P): WriteTransactionResult<P>;
  async unstake({
    accountAddress,
    gaugeAddress,
    amount,
    populate,
    overrides = {},
  }: UnstakeProps): Promise<TransactionResponse | PopulatedTransaction> {
    const claim = false;
    const lock = false;
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const gaugeContract = new Contract(gaugeAddress, GaugeAbi, signer);
    const tx = await gaugeContract.populateTransaction.withdraw(amount, claim, lock, overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Claim reward tokens from a Gauge
   * @param accountAddress
   * @param gaugeAddress
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async claimRewards<P extends ClaimRewardsProps>(props: P): WriteTransactionResult<P>;
  async claimRewards({
    accountAddress,
    gaugeAddress,
    populate,
    overrides = {},
  }: ClaimRewardsProps): Promise<TransactionResponse | PopulatedTransaction> {
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const gaugeContract = new Contract(gaugeAddress, GaugeAbi, signer);
    const tx = await gaugeContract.populateTransaction.getReward(overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Claim rewards from all Gauges and Voting Escrow
   * @param accountAddress
   * @param addresses filter, if not provided, all are claimed
   * @param claimVotingEscrow
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async claimAllRewards<P extends ClaimAllRewardsProps>(props: P): WriteTransactionResult<P>;
  async claimAllRewards({
    accountAddress,
    addresses,
    claimVotingEscrow,
    populate,
    overrides = {},
  }: ClaimAllRewardsProps): Promise<TransactionResponse | PopulatedTransaction> {
    const LOCK_REWARDS = false;
    const gauges = await this.get({ addresses });
    const gaugeAddresses = gauges.map(({ address }) => address);
    const claimRewardsZapAddress = await this.yearn.addressProvider.addressById(ContractAddressId.claimRewardsZap);
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const gaugeContract = new Contract(claimRewardsZapAddress, ClaimRewardsZapAbi, signer);
    const tx = await gaugeContract.populateTransaction.claim(
      gaugeAddresses,
      LOCK_REWARDS,
      claimVotingEscrow ?? false,
      overrides
    );

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
