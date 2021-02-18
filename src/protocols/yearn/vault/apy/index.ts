import { Context } from "@data/context";
import { Apy } from "@protocols/common/apy";

import { Vault } from "../interfaces";
import * as v1 from "./v1";
import * as v2 from "./v2";

export { v1, v2 };

export async function calculate(vault: Vault, ctx: Context): Promise<Apy> {
  if (vault.type === "v1") {
    return v1.calculate(vault, ctx);
  }
  return await v2.calculate(vault, ctx);
}
