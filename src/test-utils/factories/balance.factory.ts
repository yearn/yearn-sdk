import { Balance } from "../..";
import { createMockToken } from "./token.factory";

export const DEFAULT_BALANCE: Balance = {
  address: "0x000",
  token: createMockToken(),
  balance: "1",
  balanceUsdc: "1",
  priceUsdc: "1"
};

export const createMockBalance = (overwrites: Partial<Balance> = {}) => ({
  ...DEFAULT_BALANCE,
  ...overwrites
});
