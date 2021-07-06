import { Address, Integer } from "../common";

/**
 * Simple gas prices in gwei
 */
export interface GasPrice {
  standard: number;
  instant: number;
  fast: number;
}

export interface ZapOptions {
  slippage?: number;
  gas?: keyof GasPrice;
}
export interface ZapInApprovalStateOutput {
  spenderAddress: Address;
  tokenAddress: Address;
  ownerAddress: Address;
  allowance: Integer;
  amount: Integer;
  isApproved: Boolean;
}

export interface ZapInApprovalTransactionOutput {
  data: String;
  to: Address;
  from: Address;
  gasPrice: Integer;
}

export interface ZapOutApprovalStateOutput {
  spenderAddress: Address;
  tokenAddress: Address;
  ownerAddress: Address;
  allowance: Integer;
  amount: Integer;
  isApproved: Boolean;
}

export interface ZapOutApprovalTransactionOutput {
  data: String;
  to: Address;
  from: Address;
  gasPrice: Integer;
}

export interface ZapInOutput {
  to: Address;
  from: Address;
  data: string;
  value: string;
  sellTokenAddress: Address;
  sellTokenAmount: Integer;
  buyTokenAddress: Address;
  minTokens: Integer;
  gasPrice: Integer;
  gas: Integer;
}

export interface ZapOutOutput {
  to: Address;
  from: Address;
  data: string;
  value: Integer;
  sellTokenAddress: Address;
  sellTokenAmount: Integer;
  buyTokenAddress: Address;
  minTokens: Integer;
  gasPrice: Integer;
  gas: Integer;
}
