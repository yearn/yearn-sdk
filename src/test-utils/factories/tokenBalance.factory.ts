import { TokenBalance } from "../..";

const DEFAULT_TOKEN_BALANCE: TokenBalance = {
  address: "0x001",
  priceUsdc: "1000000", // $1 (Decimal: 6)
  balance: "1000000000000000000", // 1 (Decimal: 18)
  balanceUsdc: "1000000" // $1 (Decimal: 6)
};

export const createMockTokenBalance = (overwrites: Partial<TokenBalance> = {}): TokenBalance => ({
  ...DEFAULT_TOKEN_BALANCE,
  ...overwrites
});
