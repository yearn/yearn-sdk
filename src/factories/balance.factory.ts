import { Balance } from "..";
import { createMockToken } from "./token.factory";

console.log(createMockToken);

export const defaultBalance: Balance = {
  address: "0x000",
  token: createMockToken(),
  balance: "1",
  balanceUsdc: "1",
  priceUsdc: "1"
};

export const createMockBalance = (overwrites: Partial<Balance> = {}) => ({
  ...defaultBalance,
  ...overwrites
});
