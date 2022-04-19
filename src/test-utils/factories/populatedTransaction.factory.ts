import { PopulatedTransaction } from "@ethersproject/contracts";

const DEFAULT_POPULATED_TRANSACTION: PopulatedTransaction = {
  data: "PopulatedTransactionData",
};

export const createMockPopulatedTransaction = (
  overwrites: Partial<PopulatedTransaction> = {}
): PopulatedTransaction => ({
  ...DEFAULT_POPULATED_TRANSACTION,
  ...overwrites,
});
