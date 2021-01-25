import { CallOverrides, ethers } from "ethers";
import fromEntries from "fromentries";

import { Vault, VaultV1, VaultV2 } from "./interfaces";
import {
  StrategyContract__factory,
  VaultV1Contract__factory,
  VaultV2Contract__factory
} from "../contracts";

import { Context } from "../data/context";
import { fetchTransactionList } from "../data/etherscan";

import { BlocksPerDay } from "../utils/constants";
import { createTimedBlock, estimateBlockPrecise, TimedBlock } from "../utils/block";
import { BigNumber, toBigNumber } from "../utils/bn";
import { seconds, unix } from "../utils/time";

export interface Snapshot {
  value: BigNumber;
  block: number;
}

export function calculateYearlyRoi(
  current: Snapshot,
  previous: Snapshot,
  blocksPerDay = BlocksPerDay
): number {
  const valueDelta = current.value.minus(previous.value).dividedBy(previous.value);
  const blockDelta = new BigNumber(current.block - previous.block);
  const derivative = valueDelta.div(blockDelta);
  return derivative.toNumber() * blocksPerDay * 365;
}

export async function fetchInceptionBlock(
  vault: Vault,
  ctx: Context
): Promise<TimedBlock | null> {
  const txlist = await fetchTransactionList({ address: vault.address }, ctx);
  if (txlist.length < 2) return null;
  const inception = txlist[1]; // skip contract creation
  return { block: inception.blockNumber, timestamp: inception.timeStamp };
}

export async function fetchSortedHarvests(
  vault: VaultV2,
  ctx: Context
): Promise<number[]> {
  if (vault.strategies.length === 0) return [];
  const all = await Promise.all(
    vault.strategies.map(async ({ address }) => {
      const strategy = StrategyContract__factory.connect(address, ctx.provider);
      const filter = strategy.filters.Harvested(null, null, null, null);
      const events = await strategy.queryFilter(filter);
      return events.map(event => event.blockNumber);
    })
  );
  const harvests = Array.prototype.concat(...all);
  return harvests.sort((a, b) => a.block - b.block);
}

export type ApyBlocks = {
  [name: string]: number; // block #
};

export type Apy<T extends ApyBlocks> = {
  [A in keyof T]: number | null; // apy (0-1 : 0-100%), or null
};

export type DefaultApy = Apy<{
  inceptionSample: number;
  oneMonthSample: number;
}>;

type ApyEntry = [string, number | null];

async function calculateApyPps<T extends ApyBlocks>(
  referenceBlock: number,
  inceptionBlock: number,
  snapshotsBlocks: T,
  pricePerShare: (options?: CallOverrides) => Promise<ethers.BigNumber>
): Promise<Apy<T>> {
  const snaps = Object.entries(snapshotsBlocks).sort((a, b) => b[1] - a[1]);
  if (snaps.length === 0) return {} as Apy<T>;

  const reference: Snapshot = {
    block: referenceBlock,
    value: toBigNumber(await pricePerShare({ blockTag: referenceBlock }))
  };

  const cache: number[] = [];
  const calculated = await snaps
    .map(([name, block]) => async (entries: ApyEntry[]) => {
      if (block < inceptionBlock || block > referenceBlock) {
        entries.push([name, cache.length ? cache[cache.length - 1] : null]);
        return entries;
      }
      const snapshot: Snapshot = {
        block,
        value: toBigNumber(await pricePerShare({ blockTag: block }))
      };
      const apy = calculateYearlyRoi(reference, snapshot);
      cache.push(apy);
      entries.push([name, apy]);
      return entries;
    })
    .reduce((promise, fn) => promise.then(fn), Promise.resolve<ApyEntry[]>([]));

  return fromEntries(calculated) as Apy<T>;
}

async function fetchLatestBlock(ctx: Context): Promise<TimedBlock> {
  return {
    block: await ctx.provider.getBlockNumber(),
    timestamp: unix()
  };
}

export async function calculateVaultV1Apy(
  vault: VaultV1,
  ctx: Context
): Promise<DefaultApy> {
  const contract = VaultV1Contract__factory.connect(vault.address, ctx.provider);
  const inception = await fetchInceptionBlock(vault, ctx);
  if (!inception) return { oneMonthSample: null, inceptionSample: null };
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

export async function calculateVaultV2Apy(
  vault: VaultV2,
  ctx: Context
): Promise<DefaultApy> {
  const contract = VaultV2Contract__factory.connect(vault.address, ctx.provider);
  const harvests = await fetchSortedHarvests(vault, ctx);
  if (harvests.length < 2) return { oneMonthSample: null, inceptionSample: null };
  const latest = await createTimedBlock(harvests[harvests.length - 1], ctx);
  const inception = await createTimedBlock(harvests[0], ctx);
  const oneMonth = await estimateBlockPrecise(
    latest.timestamp - seconds("4 weeks"),
    ctx
  );
  return await calculateApyPps(
    latest.block,
    inception.block,
    { oneMonthSample: oneMonth, inceptionSample: inception.block },
    contract.pricePerShare
  );
}

export async function calculateApy(vault: Vault, ctx: Context): Promise<DefaultApy> {
  if (vault.type === "v1") return calculateVaultV1Apy(vault, ctx);
  else return calculateVaultV2Apy(vault, ctx);
}
