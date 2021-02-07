import { VaultV2Contract__factory } from "../../contracts";
import { Context } from "../../data/context";
import { Block, createTimedBlock, estimateBlockPrecise } from "../../utils/block";
import { seconds } from "../../utils/time";
import { VaultV2 } from "../interfaces";
import { fetchHarvestCalls } from "../reader";
import { calculateApyPps, VaultApy } from "./common";

function findNearestBlock(needle: Block, haystack: Block[]) {
  return haystack.reduce((a, b) =>
    Math.abs(b - needle) < Math.abs(a - needle) ? b : a
  );
}

export async function calculateV2Apy(
  vault: VaultV2,
  ctx: Context
): Promise<VaultApy> {
  const contract = VaultV2Contract__factory.connect(vault.address, ctx.provider);
  const harvests = await fetchHarvestCalls(vault, ctx);
  if (harvests.length < 2) {
    return { oneMonthSample: null, inceptionSample: null };
  }
  const latest = await createTimedBlock(harvests[harvests.length - 1], ctx);
  const inception = await createTimedBlock(harvests[0], ctx);
  const oneMonth = await estimateBlockPrecise(
    latest.timestamp - seconds("4 weeks"),
    ctx
  );
  const oneMonthHarvest = findNearestBlock(oneMonth, harvests);
  return await calculateApyPps(
    latest.block,
    inception.block,
    { oneMonthSample: oneMonthHarvest, inceptionSample: inception.block },
    contract.pricePerShare
  );
}
