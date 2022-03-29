import { TokenBalance } from "../..";

const DEFAULT_TOKEN_BALANCE: TokenBalance = {
  address: "0x001",
  priceUsdc: "1000000",
  balance: "1000000000000000000",
  balanceUsdc: "1000000"
};

export const createMockTokenBalance = (overwrites: Partial<TokenBalance> = {}): TokenBalance => ({
  ...DEFAULT_TOKEN_BALANCE,
  ...overwrites
});
