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
  Integer,
  Position,
  Seconds,
  Token,
  TokenAllowance,
  TransactionOutcome,
  VotingEscrow,
  VotingEscrowDynamic,
  VotingEscrowStatic,
  VotingEscrowTransactionType,
  VotingEscrowUserMetadata,
  WriteTransactionProps,
  WriteTransactionResult,
} from "../types";
import {
  getTimeFromNow,
  keyBy,
  roundToWeek,
  toBN,
  toMilliseconds,
  toSeconds,
  toUnit,
  USDC_DECIMALS,
  WEEK,
  YEAR,
} from "../utils";

const MAX_LOCK: Seconds = roundToWeek(YEAR * 4);

const VotingEscrowAbi = [
  "function locked(address arg0) public view returns (tuple(uint256 amount, uint256 end))",
  "function modify_lock(uint256 amount, uint256 unlock_time, address user) public returns (tuple(uint256 amount, uint256 end))",
  "function withdraw() public returns (tuple(uint256 amount, uint256 penalty))",
];

const VotingEscrowRewardsAbi = ["function claim(address user, bool relock) public returns (uint256)"];

// const VeYfiRegistryAbi = ["function veToken() public view returns (address)"];

interface ApproveLockProps extends WriteTransactionProps {
  accountAddress: Address;
  tokenAddress: Address;
  votingEscrowAddress: Address;
  amount?: Integer;
}

interface LockProps extends WriteTransactionProps {
  accountAddress: Address;
  tokenAddress: Address;
  votingEscrowAddress: Address;
  amount: Integer;
  time: number;
}

interface IncreaseLockAMountProps extends WriteTransactionProps {
  accountAddress: Address;
  votingEscrowAddress: Address;
  amount: Integer;
}

interface ExtendLockTimeProps extends WriteTransactionProps {
  accountAddress: Address;
  votingEscrowAddress: Address;
  time: number;
}

interface WithdrawUnlockedProps extends WriteTransactionProps {
  accountAddress: Address;
  votingEscrowAddress: Address;
}

interface WithdrawLockedProps extends WriteTransactionProps {
  accountAddress: Address;
  votingEscrowAddress: Address;
}

interface ClaimRewardsProps extends WriteTransactionProps {
  accountAddress: Address;
  votingEscrowAddress: Address;
}

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
    const properties = ["address token", "string name", "string symbol", "uint256 decimals"].map((prop) =>
      ParamType.from(prop)
    );
    const staticDataPromises = supportedAddresses.map(async (address) => {
      const { token, name, symbol, decimals } = await this.yearn.services.propertiesAggregator.getProperties(
        address,
        properties
      );
      const staticData: VotingEscrowStatic = {
        address,
        typeId: "VOTING_ESCROW",
        token: token as Address,
        name: name as string,
        version: "1",
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
    const properties = ["address token", "uint256 supply", "address reward_pool"].map((prop) => ParamType.from(prop));
    const dynamicDataPromises = supportedAddresses.map(async (address) => {
      const {
        token,
        supply,
        reward_pool: rewardPool,
      } = await this.yearn.services.propertiesAggregator.getProperties(address, properties);
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
        // TODO: get apy
        metadata: {
          rewardPool: rewardPool as Address,
        },
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
  async positionsOf({
    accountAddress,
    addresses,
  }: {
    accountAddress: Address;
    addresses?: Address[];
  }): Promise<Position[]> {
    const votingEscrows = await this.get({ addresses });
    const votingEscrowAddresses = votingEscrows.map(({ address }) => address);
    const underlyingTokens = votingEscrows.map(({ token }) => token);
    const tokenBalances = await this.yearn.services.helper.tokenBalances(accountAddress, votingEscrowAddresses);
    const tokenBalancesMap = keyBy(tokenBalances, "address");
    const tokenPrices = await this.yearn.services.helper.tokenPrices(underlyingTokens);
    const tokenPricesMap = keyBy(tokenPrices, "address");
    const positionsPromises = votingEscrows.map(async ({ address, token, metadata }) => {
      const { balance } = tokenBalancesMap[address];
      const { priceUsdc } = tokenPricesMap[token];
      const votingEscrowContract = new Contract(address, VotingEscrowAbi, this.ctx.provider.read);
      const locked = await votingEscrowContract.locked(accountAddress);
      const amount = (locked.amount as BigNumber).toString();
      const depositPosition: Position = {
        assetAddress: address,
        tokenAddress: token,
        typeId: "DEPOSIT",
        balance,
        underlyingTokenBalance: {
          amount,
          amountUsdc: toBN(amount)
            .times(toUnit({ amount: priceUsdc, decimals: USDC_DECIMALS }))
            .toFixed(0),
        },
        assetAllowances: [],
        tokenAllowances: [],
      };
      const votingEscrowRewardsContract = new Contract(
        metadata.rewardPool,
        VotingEscrowRewardsAbi,
        this.ctx.provider.read
      );
      const claimable = await votingEscrowRewardsContract.callStatic.claim(accountAddress, false);
      const rewardBalance = (claimable as BigNumber).toString();
      const yieldPosition: Position = {
        assetAddress: address,
        tokenAddress: token,
        typeId: "YIELD",
        balance: rewardBalance,
        underlyingTokenBalance: {
          amount: rewardBalance,
          amountUsdc: toBN(rewardBalance)
            .times(toUnit({ amount: priceUsdc, decimals: USDC_DECIMALS }))
            .toFixed(0),
        },
        assetAllowances: [],
        tokenAllowances: [],
      };
      return [depositPosition, yieldPosition];
    });
    const positions = await Promise.all(positionsPromises);
    return positions
      .flat()
      .filter(
        ({ balance, underlyingTokenBalance }) => toBN(balance).gt(0) || toBN(underlyingTokenBalance.amount).gt(0)
      );
  }

  /**
   * Get the Voting Escrows user metadata of an account
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
  }): Promise<VotingEscrowUserMetadata[]> {
    const votingEscrows = await this.get({ addresses });
    const userMetadataPromises = votingEscrows.map(async ({ address }) => {
      const signer = this.ctx.provider.write.getSigner(accountAddress);
      const votingEscrowContract = new Contract(address, VotingEscrowAbi, signer);
      const locked = await votingEscrowContract.locked(accountAddress);
      const lockedEnd = toMilliseconds((locked.end as BigNumber).toNumber());

      let unlockDate;
      let earlyExitPenaltyRatio;
      const hasLockTimeLeft = lockedEnd >= Date.now();
      if (hasLockTimeLeft) {
        unlockDate = lockedEnd;
        const toWithdraw = await votingEscrowContract.callStatic.withdraw();
        earlyExitPenaltyRatio = toBN(toWithdraw.penalty.toString())
          .div(toBN(toWithdraw.penalty.toString()).plus(toWithdraw.amount.toString()))
          .toNumber();
      }

      return {
        assetAddress: address,
        unlockDate,
        earlyExitPenaltyRatio,
      };
    });

    return Promise.all(userMetadataPromises);
  }

  /**
   * Get all Voting Escrows underlying token balances of an account
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
    const votingEscrows = await this.get({ addresses });
    const underlyingTokensAddresses = votingEscrows.map(({ token }) => token);
    const tokens = await this.yearn.services.helper.tokens(underlyingTokensAddresses);
    const tokensMap = keyBy(tokens, "address");
    const tokenBalances = await this.yearn.services.helper.tokenBalances(accountAddress, underlyingTokensAddresses);
    const tokenBalancesMap = keyBy(tokenBalances, "address");
    const balances = underlyingTokensAddresses.map((address) => {
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
   * Get the expected outcome of executing a transaction
   * @param accountAddress user wallet address
   * @param votingEscrowTransactionType transaction type
   * @param tokenAddress
   * @param votingEscrowAddress
   * @param amount
   * @param time In Weeks
   * @returns ExpectedOutcome
   */
  async getExpectedTransactionOutcome({
    accountAddress,
    votingEscrowTransactionType,
    tokenAddress,
    votingEscrowAddress,
    amount,
    time,
  }: {
    accountAddress: Address;
    votingEscrowTransactionType: VotingEscrowTransactionType;
    tokenAddress: Address;
    votingEscrowAddress: Address;
    amount?: Integer;
    time?: number;
  }): Promise<TransactionOutcome> {
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    let targetTokenAmount = "0";
    let locked;
    switch (votingEscrowTransactionType) {
      case "LOCK":
        if (!amount) throw new Error("'amount' argument missing");
        if (!time) throw new Error("'time' argument missing");
        locked = await votingEscrowContract.callStatic.modify_lock(
          amount,
          getTimeFromNow(time).toString(),
          accountAddress
        );
        break;
      case "ADD":
        if (!amount) throw new Error("'amount' argument missing");
        locked = await votingEscrowContract.callStatic.modify_lock(amount, "0", accountAddress);
        break;
      case "EXTEND":
        if (!time) throw new Error("'time' argument missing");
        locked = await votingEscrowContract.callStatic.modify_lock(
          "0",
          getTimeFromNow(time).toString(),
          accountAddress
        );
        break;
      default:
        throw new Error(`${votingEscrowTransactionType} not supported`);
    }
    targetTokenAmount = this.getVotingPower(
      (locked.amount as BigNumber).toString(),
      (locked.end as BigNumber).toNumber()
    );
    const token = await this.yearn.tokens.findByAddress(tokenAddress);
    const amountUsdc = toBN(amount)
      .times(toUnit({ amount: token?.priceUsdc ?? "0", decimals: USDC_DECIMALS }))
      .toFixed(0);

    return {
      sourceTokenAddress: tokenAddress,
      sourceTokenAmount: amount ?? "0",
      sourceTokenAmountUsdc: amountUsdc,
      targetTokenAddress: votingEscrowAddress,
      targetTokenAmount,
      targetTokenAmountUsdc: amountUsdc,
    };
  }

  /**
   * Get all Voting Escrows underlying tokens
   * @param addresses filter, if not provided, all are returned
   * @returns Token array
   */
  async tokens({ addresses }: { addresses?: Address[] }): Promise<Token[]> {
    const votingEscrows = await this.get({ addresses });
    const underlyingTokensAddresses = votingEscrows.map(({ token }) => token);
    const tokens = await this.yearn.services.helper.tokens(underlyingTokensAddresses);
    const tokensMap = keyBy(tokens, "address");
    const icons = await this.yearn.services.asset.icon(underlyingTokensAddresses);
    const tokenPrices = await this.yearn.services.helper.tokenPrices(underlyingTokensAddresses);
    const tokenPricesMap = keyBy(tokenPrices, "address");
    const tokensMetadata = await this.yearn.tokens.metadata(underlyingTokensAddresses);
    const tokensMetadataMap = keyBy(tokensMetadata, "address");
    const underlyingTokens: Token[] = underlyingTokensAddresses.map((address) => {
      return {
        ...tokensMap[address],
        icon: icons[address],
        priceUsdc: tokenPricesMap[address].priceUsdc,
        dataSource: "votingEscrows",
        supported: {
          votingEscrows: true,
        },
        metadata: tokensMetadataMap[address],
      };
    });
    return underlyingTokens;
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
    return this.yearn.tokens.allowance(accountAddress, tokenAddress, votingEscrowAddress);
  }

  /**
   * Approve the token amount to allow to be used to lock
   * @param accountAddress
   * @param tokenAddress
   * @param votingEscrowAddress
   * @param amount
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async approveLock<P extends ApproveLockProps>(props: P): WriteTransactionResult<P>;
  async approveLock({
    accountAddress,
    tokenAddress,
    votingEscrowAddress,
    amount,
    populate,
    overrides = {},
  }: ApproveLockProps): Promise<TransactionResponse | PopulatedTransaction> {
    const tx = await this.yearn.tokens.populateApprove(
      accountAddress,
      tokenAddress,
      votingEscrowAddress,
      amount ?? MaxUint256.toString(),
      overrides
    );

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Lock an amount of tokens into a Voting Escrow for the specified amount of time
   * @param accountAddress
   * @param tokenAddress
   * @param votingEscrowAddress
   * @param amount
   * @param time In weeks
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async lock<P extends LockProps>(props: P): WriteTransactionResult<P>;
  async lock({
    accountAddress,
    votingEscrowAddress,
    amount,
    time,
    populate,
    overrides = {},
  }: LockProps): Promise<TransactionResponse | PopulatedTransaction> {
    const provider = this.ctx.provider.read;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const lockTime = time * WEEK;
    const unlockTime = toBN(block.timestamp).plus(lockTime).toFixed(0);
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    const tx = await votingEscrowContract.populateTransaction.modify_lock(
      amount,
      unlockTime,
      accountAddress,
      overrides
    );

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Increase the amount of tokens locked on the Voting Escrow
   * @param accountAddress
   * @param votingEscrowAddress
   * @param amount
   * @param time In weeks
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async increaseLockAmount<P extends IncreaseLockAMountProps>(props: P): WriteTransactionResult<P>;
  async increaseLockAmount({
    accountAddress,
    votingEscrowAddress,
    amount,
    populate,
    overrides = {},
  }: IncreaseLockAMountProps): Promise<TransactionResponse | PopulatedTransaction> {
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    const tx = await votingEscrowContract.populateTransaction.modify_lock(amount, "0", accountAddress, overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Extend the time to lock the tokens on the Voting Escrow
   * @param accountAddress
   * @param votingEscrowAddress
   * @param time New period in weeks
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async extendLockTime<P extends ExtendLockTimeProps>(props: P): WriteTransactionResult<P>;
  async extendLockTime({
    accountAddress,
    votingEscrowAddress,
    time,
    populate,
    overrides = {},
  }: ExtendLockTimeProps): Promise<TransactionResponse | PopulatedTransaction> {
    const provider = this.ctx.provider.read;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const lockTime = time * WEEK;
    const unlockTime = toBN(block.timestamp).plus(lockTime).toFixed(0);
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    const tx = await votingEscrowContract.populateTransaction.modify_lock("0", unlockTime, accountAddress, overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Withdraw unlocked tokens from Voting Escrow
   * @param accountAddress
   * @param votingEscrowAddress
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async withdrawUnlocked<P extends WithdrawUnlockedProps>(props: P): WriteTransactionResult<P>;
  async withdrawUnlocked({
    accountAddress,
    votingEscrowAddress,
    populate,
    overrides = {},
  }: WithdrawUnlockedProps): Promise<TransactionResponse | PopulatedTransaction> {
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    const { penalty } = await votingEscrowContract.callStatic.withdraw();
    if (toBN(penalty.toString()).gt(0)) throw new Error("Tokens are not yet unlocked");
    const tx = await votingEscrowContract.populateTransaction.withdraw(overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Withdraw locked tokens from Voting Escrow with a penalty
   * @param accountAddress
   * @param votingEscrowAddress
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async withdrawLocked<P extends WithdrawLockedProps>(props: P): WriteTransactionResult<P>;
  async withdrawLocked({
    accountAddress,
    votingEscrowAddress,
    populate,
    overrides = {},
  }: WithdrawLockedProps): Promise<TransactionResponse | PopulatedTransaction> {
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    const tx = await votingEscrowContract.populateTransaction.withdraw(overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Claim reward tokens from from Voting Escrow
   * @param accountAddress
   * @param votingEscrowAddress
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async claimRewards<P extends ClaimRewardsProps>(props: P): WriteTransactionResult<P>;
  async claimRewards({
    accountAddress,
    votingEscrowAddress,
    populate,
    overrides = {},
  }: ClaimRewardsProps): Promise<TransactionResponse | PopulatedTransaction> {
    const [votingEscrow] = await this.get({ addresses: [votingEscrowAddress] });
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowRewardsContract = new Contract(votingEscrow.metadata.rewardPool, VotingEscrowRewardsAbi, signer);
    const tx = await votingEscrowRewardsContract.populateTransaction.claim(accountAddress, false, overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  private async getSupportedAddresses({ addresses }: { addresses?: Address[] }): Promise<Address[]> {
    // TODO: use veYfiRegistry when deployed
    // const veYfiRegistryAddress = await this.yearn.addressProvider.addressById(ContractAddressId.veYfiRegistry);
    // const veYfiRegistryContract = new Contract(veYfiRegistryAddress, VeYfiRegistryAbi, this.ctx.provider.read);
    // const veTokenAddress = await veYfiRegistryContract.veToken();
    const veTokenAddress = await this.yearn.addressProvider.addressById(ContractAddressId.veYfi);
    const votingEscrowAddresses = [veTokenAddress];
    const supportedAddresses = addresses
      ? addresses.filter((address) => votingEscrowAddresses.includes(address))
      : votingEscrowAddresses;
    return supportedAddresses;
  }

  private getVotingPower(lockAmount: Integer, unlockTime: Seconds): Integer {
    const duration = roundToWeek(unlockTime) - toSeconds(Date.now());
    if (duration <= 0) return "0";
    if (duration >= MAX_LOCK) return lockAmount;
    return toBN(lockAmount).div(MAX_LOCK).decimalPlaces(0, 1).times(duration).toString();
  }
}
