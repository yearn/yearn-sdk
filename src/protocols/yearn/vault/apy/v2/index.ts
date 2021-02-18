import { Context } from "@data/context";
import { Apy } from "@protocols/common/apy";

import { VaultV2 } from "../../interfaces";
import { calculateAveraged, shouldBeAveraged } from "./averaged";
import { calculateSimple } from "./simple";

export async function calculate(vault: VaultV2, ctx: Context): Promise<Apy> {
  if (shouldBeAveraged(vault)) {
    return await calculateAveraged(vault, ctx);
  }
  return await calculateSimple(vault, ctx);
}

export { calculateAveraged, calculateSimple };
