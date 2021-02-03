import { Context } from "../data/context";
import { BlocksPerSecond } from "./constants";
import { unix } from "./time";

const CloseEnoughBlocks = 600;
const CloseEnoughSeconds = 600;
const SearchRange = 10000;
const MaxIterations = 50;

export type Block = number;
export interface TimedBlock {
  block: Block;
  timestamp: number;
}

function findLeftRight(id: number, ctx: Context): number[] | false {
  let min = 0;
  let max = ctx.blocks.ids.length - 1;
  let mid;
  while (min <= max) {
    mid = (min + max) >>> 1;
    if (ctx.blocks.ids[mid] === id) {
      return false;
    } else if (ctx.blocks.ids[mid] < id) {
      min = mid + 1;
    } else {
      max = mid - 1;
    }
  }
  return [ctx.blocks.ids[max - 1], ctx.blocks.ids[min - 1]];
}

async function fetchBlockTimestamp(block: number, ctx: Context): Promise<number> {
  const { timestamp } = await ctx.provider.getBlock(block);
  ctx.blocks.cache[block] = timestamp;
  return timestamp;
}

function linearInterpolation(v0: number, v1: number, t: number): number {
  return (1 - t) * v0 + t * v1;
}

async function estimateTimestamp(id: number, ctx: Context): Promise<number> {
  if (ctx.blocks.cache[id]) {
    return ctx.blocks.cache[id];
  } else if (ctx.blocks.ids.length >= 2) {
    const lookup = findLeftRight(id, ctx);
    if (lookup) {
      const [max, min] = lookup;
      const vmin = ctx.blocks.cache[min];
      const vmax = ctx.blocks.cache[max];
      if (id < vmin) {
        ctx.blocks.ids.unshift(id);
        return await fetchBlockTimestamp(id, ctx);
      } else if (id > vmax) {
        ctx.blocks.ids.push(id);
        return await fetchBlockTimestamp(id, ctx);
      }
      // optimize estimations
      if (max - min <= CloseEnoughBlocks) {
        fetchBlockTimestamp(id, ctx).then(() => ctx.blocks.ids.splice(min, 0, id));
        const time = (id - min) / (max - min);
        return linearInterpolation(vmin, vmax, time);
      }

      ctx.blocks.ids.splice(min, 0, id);
      return await fetchBlockTimestamp(id, ctx);
    }
  } else if (ctx.blocks.ids.length === 1) {
    const existing = ctx.blocks.ids[0];
    if (id > existing) {
      ctx.blocks.ids.push(id);
    } else {
      ctx.blocks.ids.unshift(id);
    }
    return await fetchBlockTimestamp(id, ctx);
  } else {
    ctx.blocks.ids.push(id);
  }
  return await fetchBlockTimestamp(id, ctx);
}

export function estimateBlock(timestamp: number, currentBlock: Block): Block {
  const now = unix();
  return Math.floor(currentBlock - (now - timestamp) * BlocksPerSecond);
}

export async function estimateBlockPrecise(
  timestamp: number,
  ctx: Context
): Promise<Block> {
  const current = await ctx.provider.getBlockNumber();
  let last = estimateBlock(timestamp, current);
  let high = last + SearchRange;
  let low = last - SearchRange;
  for (let i = 0; i < MaxIterations; i++) {
    const block = await estimateTimestamp(last, ctx);
    const diff = timestamp - block;
    if (Math.abs(diff) < CloseEnoughSeconds) {
      return last;
    } else if (diff < 0) {
      high = last;
      last = Math.floor((low + last) / 2);
    } else {
      low = last;
      last = Math.floor((high + last) / 2);
    }
  }
  return last;
}

export async function createTimedBlock(
  block: number,
  ctx: Context
): Promise<TimedBlock> {
  const timestamp = await fetchBlockTimestamp(block, ctx);
  return { block, timestamp };
}

export async function fetchLatestBlock(ctx: Context): Promise<TimedBlock> {
  return {
    block: await ctx.provider.getBlockNumber(),
    timestamp: unix()
  };
}
