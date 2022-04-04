import { AccountEarningsResponse } from "../../services/subgraph/responses";

export const DEFAULT_ACCOUNT_EARNINGS_RESPONSE: AccountEarningsResponse = {
  data: {
    account: {
      vaultPositions: [
        {
          balanceShares: "1",
          token: {
            id: "AERTokenId",
            decimals: 18,
          },
          shareToken: {
            symbol: "AER",
          },
          updates: [
            {
              deposits: "1",
              withdrawals: "2",
              tokensReceived: "3",
              tokensSent: "4",
            },
          ],
          vault: {
            id: "AERVaultId",
          },
        },
      ],
    },
  },
};

export const createMockAccountEarningsResponse = (
  overwrites: Partial<AccountEarningsResponse> = {}
): AccountEarningsResponse => ({
  ...DEFAULT_ACCOUNT_EARNINGS_RESPONSE,
  ...overwrites,
});
