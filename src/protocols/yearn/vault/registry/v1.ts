import { RegistryV1Contract__factory } from "@contracts/index";
import { Context } from "@data/context";

export const RegistryV1 = "registry.ychad.eth";

export const ExcludedVaultsV1 = ["0xec0d8D3ED5477106c6D4ea27D90a60e594693C90"];

export async function fetchV1Addresses(ctx: Context): Promise<string[]> {
  const registry = RegistryV1Contract__factory.connect(RegistryV1, ctx.provider);
  const vaults = await registry.getVaults();
  return vaults.filter(address => !ExcludedVaultsV1.includes(address));
}
