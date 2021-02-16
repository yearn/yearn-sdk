import {
  RegistryV1Contract__factory,
  StrategyV1Contract__factory
} from "@contracts/index";
import { Context } from "@data/context";

import { Strategy, VaultV1 } from "../interfaces";
import { RegistryV1 } from "../registry/v1";
import { resolveBasic } from "./common";

export const DefaultStrategyV1Name = "StrategyUnnamedV1";

export interface VaultV1Info {
  controller: string;
  token: string;
  strategy: string;
  isWrapped: boolean;
  isDelegated: boolean;
}

export interface StrategyV1 extends Strategy {
  performanceFee?: number;
  withdrawalFee?: number;
}

export async function fetchInfoV1(
  address: string,
  ctx: Context
): Promise<VaultV1Info> {
  const registry = RegistryV1Contract__factory.connect(RegistryV1, ctx.provider);
  return await registry.getVaultInfo(address);
}

export async function resolveStrategyV1(
  address: string,
  ctx: Context
): Promise<StrategyV1> {
  const strategy = StrategyV1Contract__factory.connect(address, ctx.provider);
  let name;
  try {
    name = await strategy.getName();
  } catch {
    name = DefaultStrategyV1Name;
  }
  const performanceFee = await strategy
    .treasuryFee()
    .catch(() => strategy.performanceFee().catch(() => undefined))
    .then(val => val && val.toNumber());
  const withdrawalFee = await strategy
    .withdrawalFee()
    .then(val => val.toNumber())
    .catch(() => undefined);
  return {
    name,
    performanceFee,
    withdrawalFee,
    address
  };
}

export async function resolveV1(address: string, ctx: Context): Promise<VaultV1> {
  const basic = await resolveBasic(address, ctx);
  const info = await fetchInfoV1(address, ctx);
  const { performanceFee, withdrawalFee, ...strategy } = await resolveStrategyV1(
    info.strategy,
    ctx
  );
  return {
    ...basic,
    performanceFee,
    withdrawalFee,
    strategies: [strategy],
    type: "v1"
  };
}
