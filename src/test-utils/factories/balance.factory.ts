import { Balance } from "../..";
import { createMockToken } from "./token.factory";

const DEFAULT_BALANCE: Balance = {
  address: "0x000",
  token: createMockToken(),
  priceUsdc: "1000000", // $1 (Decimal: 6)
  balance: "1000000000000000000", // 1 (Decimal: 18)
  balanceUsdc: "1000000", // $1 (Decimal: 6)
};

export const createMockBalance = (overwrites: Partial<Balance> = {}): Balance => ({
  ...DEFAULT_BALANCE,
  ...overwrites,
});
