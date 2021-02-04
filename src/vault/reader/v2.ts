import { StrategyV2Contract__factory } from "../../contracts";
import { Context } from "../../data/context";
import { Block } from "../../utils/block";
import { VaultV2 } from "../interfaces";

export async function fetchHarvestCalls(
  vault: VaultV2,
  ctx: Context
): Promise<Block[]> {
  if (vault.strategies.length === 0) return [];
  const all = await Promise.all(
    vault.strategies.map(async ({ address }) => {
      const strategy = StrategyV2Contract__factory.connect(address, ctx.provider);
      const filter = strategy.filters.Harvested(null, null, null, null);
      const events = await strategy.queryFilter(filter);
      return events.map(event => event.blockNumber);
    })
  );
  const harvests = Array.prototype.concat(...all);
  return harvests.sort((a, b) => a.block - b.block);
}
