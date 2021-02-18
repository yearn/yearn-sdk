import { VaultV1Contract__factory } from "@contracts/index";
import { Context } from "@data/context";
import { Apy } from "@protocols/interfaces";
import { estimateBlockPrecise, fetchLatestBlock } from "@utils/block";
import { seconds } from "@utils/time";

import { VaultV1 } from "../../interfaces";
import { fetchInceptionBlock } from "../../reader";
import { calculateFromPps } from "../common";

export async function calculateSimple(vault: VaultV1, ctx: Context): Promise<Apy> {
  const contract = VaultV1Contract__factory.connect(vault.address, ctx.provider);
  const inception = await fetchInceptionBlock(vault, ctx);
  if (!inception) {
    return {
      recommended: 0,
      composite: false,
      type: "error",
      description: "no inception sampple",
      data: { oneMonthSample: null, inceptionSample: null }
    };
  }
  const latest = await fetchLatestBlock(ctx);
  const oneMonth = await estimateBlockPrecise(
    latest.timestamp - seconds("4 weeks"),
    ctx
  );
  const data = await calculateFromPps(
    latest.block,
    inception.block,
    { oneMonthSample: oneMonth, inceptionSample: inception.block },
    contract.getPricePerFullShare
  );
  const apy = {
    recommended: data.oneMonthSample || 0,
    type: "pricePerShareV1OneMonth",
    composite: false,
    description: "Price per share - One month sample",
    data
  };
  return apy;
}
