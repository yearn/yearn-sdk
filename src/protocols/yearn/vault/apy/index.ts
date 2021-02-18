import { Context } from "@data/context";
import * as curve from "@protocols/curve";
import { Apy } from "@protocols/interfaces";

import { Vault } from "../interfaces";
import { calculateApyPps, calculateYearlyRoi } from "./common";
import { calculateV1Apy } from "./v1";
import { calculateV2Apy } from "./v2";

export { calculateApyPps, calculateV1Apy, calculateV2Apy, calculateYearlyRoi };

export async function calculateApy(vault: Vault, ctx: Context): Promise<Apy> {
  let apy;
  const vaultTokenAddress = vault.token.address;
  if (vault.type === "v1") {
    const isCurveVault = await curve.hasCurvePool(vaultTokenAddress, ctx);
    if (isCurveVault) {
      apy = await curve.calculateApy(vaultTokenAddress, ctx);
    } else {
      apy = await calculateV1Apy(vault, ctx);
    }
  } else {
    apy = await calculateV2Apy(vault, ctx);
  }
  return apy;
}
