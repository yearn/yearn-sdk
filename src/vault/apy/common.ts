import { CallOverrides, ethers } from "ethers";
import fromEntries from "fromentries";

import { Block } from "../../utils/block";
import { BigNumber, toBigNumber } from "../../utils/bn";
import { BlocksPerDay } from "../../utils/constants";

export interface Snapshot {
  value: BigNumber;
  block: Block;
}

export type ApyBlocks = {
  [name: string]: Block; // block #
};

export type Apy<T extends ApyBlocks> = {
  [A in keyof T]: number | null; // apy (0-1 : 0-100%), or null
};

export type VaultApy = Apy<{
  inceptionSample: number;
  oneMonthSample: number;
}>;

export type ApyEntry = [string, number | null];

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

export async function calculateApyPps<T extends ApyBlocks>(
  referenceBlock: number,
  inceptionBlock: number,
  snapshotsBlocks: T,
  pricePerShare: (options?: CallOverrides) => Promise<ethers.BigNumber>
): Promise<Apy<T>> {
  const snaps = Object.entries(snapshotsBlocks).sort((a, b) => b[1] - a[1]);
  if (snaps.length === 0) {
    return {} as Apy<T>;
  }

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
