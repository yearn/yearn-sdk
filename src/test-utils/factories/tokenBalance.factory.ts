import { TokenBalance } from "../..";

const DEFAULT_TOKEN_BALANCE: TokenBalance = {
  address: "0x001",
  priceUsdc: "1",
  balance: "1",
  balanceUsdc: "1"
};

export const createMockTokenBalance = (overwrites: Partial<TokenBalance> = {}) => ({
  ...DEFAULT_TOKEN_BALANCE,
  ...overwrites
});
