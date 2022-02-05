import * as Factory from "factory.ts";

import { Token } from "..";

export const tokenFactory = Factory.Sync.makeFactory<Token>({
  address: "0x000000000000000000000000000000000000dead",
  decimals: "18",
  symbol: "DEAD",
  name: "Dead Token",
  priceUsdc: "0",
  supported: {
    zapper: true
  }
});
