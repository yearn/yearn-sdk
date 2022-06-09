import { ParamType } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { MaxUint256 } from "@ethersproject/constants";
import { CallOverrides, Contract, PopulatedTransaction } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/providers";

import { ChainId } from "../chain";
import { ContractAddressId, ServiceInterface } from "../common";
import {
  Address,
  Balance,
  Integer,
  Position,
  Token,
  TokenAllowance,
  VotingEscrow,
  VotingEscrowDynamic,
  VotingEscrowStatic,
  WriteTransactionProps,
  WriteTransactionResult,
} from "../types";
import { keyBy, toBN, toUnit, USDC_DECIMALS } from "../utils";

const DAY = 86400;
const WEEK = DAY * 7;

const VotingEscrowAbi = [
  "function create_lock(uint256 _value, uint256 _unlock_time) public",
  "function increase_amount(uint256 _value) public",
  "function increase_unlock_time(uint256 _unlock_time) public",
  "function withdraw() public",
  "function force_withdraw() public",
  "function locked(address arg0) public view returns (tuple(uint128 amount, uint256 end))",
  "function locked__end(address _addr) public view returns (uint256)",
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
   * Get all Voting Escrows underlying token balances of an account
   * @param accountAddress user wallet address
   * @param addresses filter, if not provided, all are returned
   * @returns Balance array
   */
  async balances({ account, addresses }: { account: Address; addresses?: Address[] }): Promise<Balance[]> {
    const votingEscrows = await this.get({ addresses });
    const underlyingTokensAddresses = votingEscrows.map(({ token }) => token);
    const tokens = await this.yearn.services.helper.tokens(underlyingTokensAddresses);
    const tokensMap = keyBy(tokens, "address");
    const tokenBalances = await this.yearn.services.helper.tokenBalances(account, underlyingTokensAddresses);
    const tokenBalancesMap = keyBy(tokenBalances, "address");
    const balances = underlyingTokensAddresses.map((address) => {
      const { balance, balanceUsdc, priceUsdc } = tokenBalancesMap[address];
      const token = tokensMap[address];
      return {
        address: account,
        token,
        balance,
        balanceUsdc,
        priceUsdc,
      };
    });
    return balances;
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
   * @param populate return populated transaction payload when truthy
   * @param overrides
   * @returns TransactionResponse | PopulatedTransaction
   */
  async approveLock<P extends WriteTransactionProps>(props: P): WriteTransactionResult<P>;
  async approveLock({
    accountAddress,
    tokenAddress,
    votingEscrowAddress,
    amount,
    populate,
    overrides = {},
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    votingEscrowAddress: Address;
    amount?: Integer;
    populate?: boolean;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse | PopulatedTransaction> {
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
  async lock<P extends WriteTransactionProps>(props: P): WriteTransactionResult<P>;
  async lock({
    accountAddress,
    votingEscrowAddress,
    amount,
    time,
    populate,
    overrides = {},
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    votingEscrowAddress: Address;
    amount: Integer;
    time: number;
    populate?: boolean;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse | PopulatedTransaction> {
    const provider = this.ctx.provider.read;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const lockTime = time * WEEK;
    const unlockTime = toBN(block.timestamp).plus(lockTime).toFixed(0);
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    const tx = await votingEscrowContract.populateTransaction.create_lock(amount, unlockTime, overrides);

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
  async increaseLockAmount<P extends WriteTransactionProps>(props: P): WriteTransactionResult<P>;
  async increaseLockAmount({
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
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    const tx = await votingEscrowContract.populateTransaction.increase_amount(amount, overrides);

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
  async extendLockTime<P extends WriteTransactionProps>(props: P): WriteTransactionResult<P>;
  async extendLockTime({
    accountAddress,
    votingEscrowAddress,
    time,
    populate,
    overrides = {},
  }: {
    accountAddress: Address;
    tokenAddress: Address;
    votingEscrowAddress: Address;
    time: number;
    populate?: boolean;
    overrides?: CallOverrides;
  }): Promise<TransactionResponse | PopulatedTransaction> {
    const provider = this.ctx.provider.read;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const lockTime = time * WEEK;
    const unlockTime = toBN(block.timestamp).plus(lockTime).toFixed(0);
    const signer = this.ctx.provider.write.getSigner(accountAddress);
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    const tx = await votingEscrowContract.populateTransaction.increase_unlock_time(unlockTime, overrides);

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
  async withdrawUnlocked<P extends WriteTransactionProps>(props: P): WriteTransactionResult<P>;
  async withdrawUnlocked({
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
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
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
  async withdrawLocked<P extends WriteTransactionProps>(props: P): WriteTransactionResult<P>;
  async withdrawLocked({
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
    const votingEscrowContract = new Contract(votingEscrowAddress, VotingEscrowAbi, signer);
    const tx = await votingEscrowContract.populateTransaction.force_withdraw(overrides);

    if (populate) return tx;

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  // TODO: claimReward

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
