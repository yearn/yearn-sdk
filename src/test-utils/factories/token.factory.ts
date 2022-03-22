import { Token } from "../..";

const DEFAULT_TOKEN: Token = {
  address: "0x001",
  decimals: "18",
  symbol: "DEAD",
  name: "Dead Token",
  priceUsdc: "0",
  dataSource: "vaults",
  supported: {}
};

export const createMockToken = (overwrites: Partial<Token> = {}): Token => ({
  ...DEFAULT_TOKEN,
  ...overwrites
});
