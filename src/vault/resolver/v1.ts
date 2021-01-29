import { Context } from "../../data/context";
import { VaultV1 } from "../interfaces";
import { resolveBasic } from "./common";

export async function resolveV1(address: string, ctx: Context): Promise<VaultV1> {
  const basic = await resolveBasic(address, ctx);
  return { ...basic, type: "v1" };
}
