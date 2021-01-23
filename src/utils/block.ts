import { Context } from "../data/context";

import { unix } from "./time";

export const SecondsPerBlock = 13.25; // avg 2020
export const BlocksPerSecond = 1 / SecondsPerBlock;
export const BlocksPerDay = BlocksPerSecond * 60 * 60 * 24;

const CloseEnoughBlocks = 600;
const CloseEnoughSeconds = 600;
const SearchRange = 10000;
const MaxIterations = 50;

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

async function fetch(id: number, ctx: Context): Promise<number> {
  const { timestamp } = await ctx.provider.getBlock(id);
  ctx.blocks.cache[id] = timestamp;
  return timestamp;
}

function linearInterpolation(v0: number, v1: number, t: number): number {
  return (1 - t) * v0 + t * v1;
}

async function wrap(id: number, ctx: Context): Promise<number> {
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
        return await fetch(id, ctx);
      } else if (id > vmax) {
        ctx.blocks.ids.push(id);
        return await fetch(id, ctx);
      } else {
        // optimize estimations
        if (max - min <= CloseEnoughBlocks) {
          fetch(id, ctx).then(() => ctx.blocks.ids.splice(min, 0, id));
          const time = (id - min) / (max - min);
          return linearInterpolation(vmin, vmax, time);
        } else {
          ctx.blocks.ids.splice(min, 0, id);
          return await fetch(id, ctx);
        }
      }
    }
  } else if (ctx.blocks.ids.length === 1) {
    const existing = ctx.blocks.ids[0];
    if (id > existing) ctx.blocks.ids.push(id);
    else ctx.blocks.ids.unshift(id);
    return await fetch(id, ctx);
  } else {
    ctx.blocks.ids.push(id);
  }
  return await fetch(id, ctx);
}

export function estimateBlock(timestamp: number, currentBlock: number): number {
  const now = unix();
  return Math.floor(currentBlock - (now - timestamp) * BlocksPerSecond);
}

export async function estimateBlockPrecise(
  timestamp: number,
  currentBlock: number,
  ctx: Context
): Promise<number> {
  let last = estimateBlock(timestamp, currentBlock);
  let high = last + SearchRange;
  let low = last - SearchRange;
  for (let i = 0; i < MaxIterations; i++) {
    const block = await wrap(last, ctx);
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
