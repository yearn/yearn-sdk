import { Balance } from "..";
import { tokenFactory } from "./token.factory";

export const defaultBalance: Balance = {
  address: "0x000",
  token: tokenFactory.build(),
  balance: "1",
  balanceUsdc: "1",
  priceUsdc: "1"
};

const createMockBalance = (overwrites: Partial<Balance> = {}) => ({
  ...defaultBalance,
  ...overwrites
});

export { createMockBalance };
