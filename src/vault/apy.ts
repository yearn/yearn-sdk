import { CallOverrides, ethers } from "ethers";

import { Vault, VaultV1, VaultV2 } from "./interfaces";
import { VaultV1Contract__factory, VaultV2Contract__factory } from "../contracts";

import { Context } from "../data/context";
import { fetchTransactionList } from "../data/etherscan";

import { BlocksPerDay, estimateBlockPrecise } from "../utils/block";
import { BigNumber, toBigNumber } from "../utils/bn";
import { unix } from "../utils/time";

export interface Snapshot {
  value: BigNumber;
  block: number;
}

export interface Apy {
  inceptionSample: number | null;
  oneMonthSample: number | null;
}

export function calculateYearlyRoi(
  current: Snapshot,
  previous: Snapshot,
  blockPerDay: number
): number {
  const valueDelta = current.value.minus(previous.value).dividedBy(previous.value);
  const blockDelta = new BigNumber(current.block - previous.block);
  const derivative = valueDelta.div(blockDelta);
  return derivative.toNumber() * blockPerDay * 365;
}

export async function fetchInceptionBlock(
  vault: Vault,
  ctx: Context
): Promise<number | null> {
  const txlist = await fetchTransactionList({ address: vault.address }, ctx);
  if (txlist.length < 2) return null;
  const inception = txlist[1]; // skip contract creation
  return inception.blockNumber;
}

async function fetchSnapshotBlocks(vault: Vault, ctx: Context) {
  const currentBlock = await ctx.provider.getBlockNumber();
  const inceptionBlock = await fetchInceptionBlock(vault, ctx);
  const oneMonthAgoBlock = await estimateBlockPrecise(
    unix("-4 weeks"),
    currentBlock,
    ctx
  );
  return {
    currentBlock,
    inceptionBlock,
    oneMonthAgoBlock
  };
}

export async function calculateApyPps(
  vault: Vault,
  decimals: number,
  pps: (override?: CallOverrides) => Promise<ethers.BigNumber>,
  ctx: Context
): Promise<Apy> {
  const {
    currentBlock,
    inceptionBlock,
    oneMonthAgoBlock
  } = await fetchSnapshotBlocks(vault, ctx);
  if (inceptionBlock === null)
    return { inceptionSample: null, oneMonthSample: null };
  const inception = {
    block: inceptionBlock,
    value: new BigNumber(10 ** decimals)
  };
  const current = {
    block: currentBlock,
    value: toBigNumber(await pps())
  };
  const inceptionSample = calculateYearlyRoi(current, inception, BlocksPerDay);
  if (inceptionBlock > oneMonthAgoBlock) {
    return {
      inceptionSample,
      oneMonthSample: inceptionSample
    };
  }
  const oneMonthAgo = {
    block: oneMonthAgoBlock,
    value: toBigNumber(await pps({ blockTag: oneMonthAgoBlock }))
  };
  const oneMonthSample = calculateYearlyRoi(current, oneMonthAgo, BlocksPerDay);
  return {
    inceptionSample,
    oneMonthSample
  };
}

export async function calculateVaultV1Apy(
  vault: VaultV1,
  ctx: Context
): Promise<Apy> {
  const contract = VaultV1Contract__factory.connect(vault.address, ctx.provider);
  const decimals = 18;
  return await calculateApyPps(vault, decimals, contract.getPricePerFullShare, ctx);
}

export async function calculateVaultV2Apy(
  vault: VaultV2,
  ctx: Context
): Promise<Apy> {
  const contract = VaultV2Contract__factory.connect(vault.address, ctx.provider);
  const decimals = vault.decimals;
  return await calculateApyPps(vault, decimals, contract.pricePerShare, ctx);
}

export async function calculateApy(vault: Vault, ctx: Context): Promise<Apy> {
  if (vault.type === "v1") return calculateVaultV1Apy(vault, ctx);
  else return calculateVaultV2Apy(vault, ctx);
}
