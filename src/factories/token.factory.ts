import { Token } from "..";

export const defaultToken: Token = {
  address: "0x001",
  decimals: "18",
  symbol: "DEAD",
  name: "Dead Token",
  priceUsdc: "0",
  supported: {
    zapper: true
  }
};

export const createMockToken = (overwrites: Partial<Token> = {}) => ({
  ...defaultToken,
  ...overwrites
});
