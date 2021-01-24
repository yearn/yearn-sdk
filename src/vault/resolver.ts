import { Context } from "../data/context";
import { objectAll } from "../utils/promise";
import {
  Erc20Contract__factory,
  StrategyContract__factory,
  VaultV1Contract__factory,
  VaultV2Contract__factory
} from "../contracts";

import { Strategy, Token, VaultBase, VaultV1, VaultV2 } from "./interfaces";
import { NullAddress } from "../utils/constants";

async function resolveToken(address: string, ctx: Context): Promise<Token> {
  const token = Erc20Contract__factory.connect(address, ctx.provider);
  const structure = {
    name: token.name(),
    symbol: token.symbol(),
    decimals: token.decimals()
  };
  const result = await objectAll(structure);
  return {
    ...result,
    address
  };
}

async function resolveStrategy(address: string, ctx: Context): Promise<Strategy> {
  const strategy = StrategyContract__factory.connect(address, ctx.provider);
  const structure = {
    name: strategy.name()
  };
  const result = await objectAll(structure);
  return {
    ...result,
    address
  };
}

export async function resolveBasic(
  address: string,
  ctx: Context
): Promise<VaultBase> {
  const vault = VaultV1Contract__factory.connect(address, ctx.provider);
  const structure = {
    name: vault.name(),
    symbol: vault.symbol(),
    decimals: vault.decimals(),
    token: vault.token().then(address => resolveToken(address, ctx))
  };
  const result = await objectAll(structure);
  return {
    ...result,
    address
  };
}

export async function resolveV1(address: string, ctx: Context): Promise<VaultV1> {
  const basic = await resolveBasic(address, ctx);
  return { ...basic, type: "v1" };
}

export async function resolveV2(address: string, ctx: Context): Promise<VaultV2> {
  const basic = await resolveBasic(address, ctx);
  const vault = VaultV2Contract__factory.connect(address, ctx.provider);
  const structure = {
    emergencyShutdown: vault.emergencyShutdown()
  };
  const specific = await objectAll(structure);

  const strategyAddresses = [];

  let strategyAddress,
    i = 0;
  do {
    strategyAddress = await vault.withdrawalQueue(i++);
    strategyAddresses.push(strategyAddress);
  } while (strategyAddress !== NullAddress);

  strategyAddresses.pop(); // Remove NullAddresses

  const strategies = await Promise.all(
    strategyAddresses.map(address => resolveStrategy(address, ctx))
  );

  return { ...basic, ...specific, strategies, type: "v2" };
}
