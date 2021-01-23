import { Context } from "../data/context";
import { objectAll } from "../utils/promise";
import {
  Erc20Contract__factory,
  VaultV1Contract__factory,
  VaultV2Contract__factory
} from "../contracts";

import { Token, VaultBase, VaultV1, VaultV2 } from "./interfaces";

export async function resolveToken(address: string, ctx: Context): Promise<Token> {
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
  return { ...basic, ...specific, type: "v2" };
}
