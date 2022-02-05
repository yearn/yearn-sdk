import * as Factory from "factory.ts";

import { Balance } from "..";
import { tokenFactory } from "./token.factory";

export const balanceFactory = Factory.Sync.makeFactory<Balance>({
  address: "0x000000000000000000000000000000000000dead",
  token: tokenFactory.build(),
  balance: "1",
  balanceUsdc: "1",
  priceUsdc: "1"
});
