import { Address, Integer, SdkError, Usdc } from "../common";

export class SimulationError extends SdkError {}
export class ZapperError extends SdkError {}
export class EthersError extends SdkError {}
export class TenderlyError extends SdkError {}
export class PriceFetchingError extends SdkError {}

export interface TransactionOutcome {
  sourceTokenAddress: Address;
  sourceTokenAmount: Integer;
  targetTokenAddress: Address;
  targetTokenAmount: Integer;
  targetTokenAmountUsdc: Usdc;
  targetUnderlyingTokenAddress: Address;
  targetUnderlyingTokenAmount: Integer;
  conversionRate: number;
  slippage: number;
}

export interface SimulationOptions {
  slippage?: number;
  root?: string;
  forkId?: string;
  gasPrice?: Integer;
  maxFeePerGas?: Integer;
  maxPriorityFeePerGas?: Integer;
  gasLimit?: Integer;
  save?: boolean;
}
