import { Address, Integer, Usdc } from "../common";

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
  gasPrice?: Integer;
  gasLimit?: Integer;
}
