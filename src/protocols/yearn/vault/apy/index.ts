import { Context } from "@data/context";
import { Apy } from "@protocols/interfaces";

import { Vault } from "../interfaces";
import { calculateFromPps, calculateYearlyRoi } from "./common";
import * as v1 from "./v1";
import * as v2 from "./v2";

export { calculateFromPps, calculateYearlyRoi, v1, v2 };

export async function calculate(vault: Vault, ctx: Context): Promise<Apy> {
  if (vault.type === "v1") {
    return v1.calculate(vault, ctx);
  }
  return await v2.calculate(vault, ctx);
}
