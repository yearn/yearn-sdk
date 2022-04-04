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

export interface ZapApprovalStateOutput {
  spenderAddress: Address;
  tokenAddress: Address;
  ownerAddress: Address;
  allowance: Integer;
  amount: Integer;
  isApproved: boolean;
}

export interface ZapApprovalTransactionOutput {
  data: string;
  to: Address;
  from: Address;
  gasPrice: Integer;
}

export interface ZapOutput {
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

export enum ZapProtocol {
  PICKLE = "pickle",
  YEARN = "yearn",
}
