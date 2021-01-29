import { CurveRegistryContract__factory } from "../../contracts";
import { Context } from "../../data/context";
import { estimateBlockPrecise, fetchLatestBlock } from "../../utils/block";
import { NullAddress } from "../../utils/constants";
import { seconds } from "../../utils/time";
import { Apy, calculateApyPps } from "../../vault/apy";

export const CurveRegistry = "0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c";

export type CurvePoolApy = Apy<{
  oneMonthSample: number;
}>;

export async function calculatePoolApy(
  lpToken: string,
  ctx: Context
): Promise<CurvePoolApy> {
  const registry = CurveRegistryContract__factory.connect(
    CurveRegistry,
    ctx.provider
  );
  const latest = await fetchLatestBlock(ctx);
  const oneMonth = await estimateBlockPrecise(
    latest.timestamp - seconds("4 weeks"),
    ctx
  );
  return await calculateApyPps(
    latest.block,
    oneMonth,
    { oneMonthSample: oneMonth },
    overrides => registry.get_virtual_price_from_lp_token(lpToken, overrides)
  );
}

export async function isToken(lpToken: string, ctx: Context): Promise<boolean> {
  const registry = CurveRegistryContract__factory.connect(
    CurveRegistry,
    ctx.provider
  );
  const pool = await registry.get_pool_from_lp_token(lpToken);
  return pool !== NullAddress;
}
