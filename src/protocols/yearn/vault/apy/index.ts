import { Context } from "../../../../data/context";
import * as curve from "../../../curve";
import { Apy } from "../../../interfaces";
import { Vault } from "../interfaces";
import { calculateApyPps, calculateYearlyRoi } from "./common";
import { calculateV1Apy } from "./v1";
import { calculateV2Apy } from "./v2";

export { calculateApyPps, calculateV1Apy, calculateV2Apy, calculateYearlyRoi };

export async function calculateApy(vault: Vault, ctx: Context): Promise<Apy> {
  let apy;
  const vaultTokenAddress = vault.token.address;
  const isCurveVault = await curve.hasCurvePool(vaultTokenAddress, ctx);
  // TODO: Calculate APY based on vault metadata "apyType" field... metadata not yet deployed
  if (isCurveVault) {
    apy = await curve.calculateApy(vaultTokenAddress, ctx);
  } else if (vault.type === "v1") {
    apy = await calculateV1Apy(vault, ctx);
  } else {
    apy = await calculateV2Apy(vault, ctx);
  }
  return apy;
}
