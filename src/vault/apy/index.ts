import { Context } from "../../data/context";
import { Vault } from "../interfaces";
import { Apy, calculateApyPps, calculateYearlyRoi, VaultApy } from "./common";
import { calculateV1Apy } from "./v1";
import { calculateV2Apy } from "./v2";

export {
  Apy,
  calculateApyPps,
  calculateV1Apy,
  calculateV2Apy,
  calculateYearlyRoi,
  VaultApy
};

export async function calculateApy(vault: Vault, ctx: Context): Promise<VaultApy> {
  if (vault.type === "v1") {
    return calculateV1Apy(vault, ctx);
  }
  return calculateV2Apy(vault, ctx);
}
