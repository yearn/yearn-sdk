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

export interface ZapInOutput {
  to: Address;
  from: Address;
  data: String;
  value: String;
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
  data: String;
  value: Integer;
  sellTokenAddress: Address;
  sellTokenAmount: Integer;
  buyTokenAddress: Address;
  minTokens: Integer;
  gasPrice: Integer;
  gas: Integer;
}
