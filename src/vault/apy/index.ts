import { Context } from "../../data/context";
import { Vault } from "../interfaces";
import { Apy, calculateApyPps, calculateYearlyRoi, VaultApy } from "./common";
import { calculateVaultV1Apy } from "./v1";
import { calculateVaultV2Apy } from "./v2";

export { Apy, calculateApyPps, calculateYearlyRoi, VaultApy };

export async function calculateApy(vault: Vault, ctx: Context): Promise<VaultApy> {
  if (vault.type === "v1") {
    return calculateVaultV1Apy(vault, ctx);
  }
  return calculateVaultV2Apy(vault, ctx);
}
