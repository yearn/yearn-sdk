import { VaultV2Contract__factory } from "@contracts/index";
import { Context } from "@data/context";
import { Apy } from "@protocols/interfaces";
import {
  createTimedBlock,
  estimateBlockPrecise,
  fetchLatestBlock
} from "@utils/block";
import { seconds } from "@utils/time";
import semver from "semver";

import { VaultV2 } from "../../interfaces";
import { fetchHarvestCalls } from "../../reader";
import { calculateFromPps } from "../common";

const AveragedFromVersion = "0.3.2";

export function shouldBeAveraged(vault: VaultV2): boolean {
  return semver.gte(vault.apiVersion, AveragedFromVersion);
}

export async function calculateAveraged(vault: VaultV2, ctx: Context): Promise<Apy> {
  const contract = VaultV2Contract__factory.connect(vault.address, ctx.provider);
  const harvests = await fetchHarvestCalls(vault, ctx);
  if (harvests.length < 2) {
    return {
      recommended: 0,
      composite: false,
      type: "error",
      description: "no harvests",
      data: { oneMonthSample: null, inceptionSample: null }
    };
  }
  const latest = await fetchLatestBlock(ctx);
  const inception = await createTimedBlock(harvests[0], ctx);
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
    type: "pricePerShareV2OneMonth",
    composite: false,
    description: "Price per share - One month sample",
    data
  };
  return apy;
}
