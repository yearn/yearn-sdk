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
  VotingEscrow,
  VotingEscrowDynamic,
  VotingEscrowMetadata,
  VotingEscrowStatic,
  VotingEscrowUserSummary,
} from "../types";

const VotingEscrowAbi = [
  "function create_lock(uint256 _value, uint256 _unlock_time) public",
  "function increase_amount(uint256 _value) public",
  "function increase_unlock_time(uint256 _unlock_time) public",
  "function withdraw() public",
  "function force_withdraw() public",
  "function locked__end(address _addr) public view returns (uint256)",
  "function balanceOf(address addr) public view returns (uint256)",
];

export class VotingEscrowInterface<T extends ChainId> extends ServiceInterface<T> {
  /**
   * Get all Voting Escrow assets
   * @param addresses filter, if not provided, all are returned
   * @returns VotingEscrow array
   */
  async get({ addresses }: { addresses?: Address[] }): Promise<VotingEscrow[]> {
    console.log(addresses);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Get static properties of Voting Escrows
   * @param addresses filter, if not provided, all are returned
   * @returns VotingEscrowStatic array
   */
  async getStatic({ addresses }: { addresses?: Address[] }): Promise<VotingEscrowStatic[]> {
    console.log(addresses);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Get dynamic properties of Voting Escrows
   * @param addresses filter, if not provided, all are returned
   * @returns VotingEscrowDynamic array
   */
  async getDynamic({ addresses }: { addresses?: Address[] }): Promise<VotingEscrowDynamic[]> {
    console.log(addresses);
    throw new Error("NOT IMPLEMENTED");
  }

  /**
   * Get all Voting Escrows positions of an account
   * @param accountAddress user wallet address
   * @param addresses filter, if not provided, all are returned
   * @returns Position array
   */
  async positionsOf({ account, addresses }: { account: Address; addresses?: Address[] }): Promise<Position[]> {
    console.log(account, addresses);
    throw new Error("NOT IMPLEMENTED");
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
   * @returns VotingEscrowMetadata array
   */
  async metadataOf({
    account,
    addresses,
  }: {
    account: Address;
    addresses?: Address[];
  }): Promise<VotingEscrowMetadata[]> {
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
}
