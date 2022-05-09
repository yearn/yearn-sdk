import { TransactionOutcome } from "../../types";

const DEFAULT_TRANSACTION_OUTCOME: TransactionOutcome = {
  sourceTokenAddress: "0xSourceTokenAddress",
  sourceTokenAmount: "1000000000000000000",
  targetTokenAddress: "0xTargetTokenAddress",
  targetTokenAmount: "42000000000000000000",
  targetTokenAmountUsdc: "42000000",
  targetUnderlyingTokenAddress: "0xTargetUnderlyingTokenAddress",
  targetUnderlyingTokenAmount: "1000000000000000000",
  conversionRate: 0.5,
  slippage: 1,
};

export const createMockTransactionOutcome = (overwrites: Partial<TransactionOutcome> = {}): TransactionOutcome => ({
  ...DEFAULT_TRANSACTION_OUTCOME,
  ...overwrites,
});
