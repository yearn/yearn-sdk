import {
  Erc20Contract__factory,
  VaultV1Contract__factory
} from "../../../../../contracts";
import { Context } from "../../../../../data/context";
import { objectAll } from "../../../../../utils/promise";
import { Token, VaultBase } from "../interfaces";

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
