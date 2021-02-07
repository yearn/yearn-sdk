import { VaultV1Contract__factory } from "../../contracts";
import { Context } from "../../data/context";
import { estimateBlockPrecise, fetchLatestBlock } from "../../utils/block";
import { seconds } from "../../utils/time";
import { VaultV1 } from "../interfaces";
import { fetchInceptionBlock } from "../reader";
import { calculateApyPps, VaultApy } from "./common";

export async function calculateVaultV1Apy(
  vault: VaultV1,
  ctx: Context
): Promise<VaultApy> {
  const contract = VaultV1Contract__factory.connect(vault.address, ctx.provider);
  const inception = await fetchInceptionBlock(vault, ctx);
  if (!inception) {
    return { oneMonthSample: null, inceptionSample: null };
  }
  const latest = await fetchLatestBlock(ctx);
  const oneMonth = await estimateBlockPrecise(
    latest.timestamp - seconds("4 weeks"),
    ctx
  );
  return await calculateApyPps(
    latest.block,
    inception.block,
    { oneMonthSample: oneMonth, inceptionSample: inception.block },
    contract.getPricePerFullShare
  );
}
