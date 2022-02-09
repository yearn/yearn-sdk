import { TokenBalance } from "..";

export const defaultTokenBalance: TokenBalance = {
  address: "0x001",
  priceUsdc: "1",
  balance: "1",
  balanceUsdc: "1"
};

export const createMockTokenBalance = (overwrites: Partial<TokenBalance> = {}) => ({
  ...defaultTokenBalance,
  ...overwrites
});
