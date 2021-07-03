import { Address, Integer } from "../common";

export interface TransactionOutcome {
  sourceTokenAddress: Address;
  sourceTokenAmount: Integer;
  targetTokenAddress: Address;
  targetTokenAmount: Integer;
  targetUnderlyingTokenAddress?: Address;
  targetUnderlyingTokenAmount?: Integer;
  conversionRate?: number;
  slippage?: number;
}
