import { Context } from "../data/context";
import {
  RegistryV1Contract__factory,
  RegistryV2Contract__factory
} from "../contracts";

const RegistryV1 = "registry.ychad.eth";
const RegistryV2 = "v2.registry.ychad.eth";

const ExcludedVaultsV1 = ["0xec0d8D3ED5477106c6D4ea27D90a60e594693C90"];

export async function fetchV1Addresses(ctx: Context): Promise<string[]> {
  const registry = RegistryV1Contract__factory.connect(RegistryV1, ctx.provider);
  const vaults = await registry.getVaults();
  return vaults.filter(address => !ExcludedVaultsV1.includes(address));
}

export async function fetchV2Addresses(ctx: Context): Promise<string[]> {
  const registry = RegistryV2Contract__factory.connect(RegistryV2, ctx.provider);
  const prodFilter = registry.filters.NewVault(null, null, null, null);
  const prod = await registry.queryFilter(prodFilter);
  return prod.map(event => event.args && event.args.vault);
}

export async function fetchV2ExperimentalAddresses(ctx: Context): Promise<string[]> {
  const registry = RegistryV2Contract__factory.connect(RegistryV2, ctx.provider);
  const testFilter = registry.filters.NewExperimentalVault(null, null, null, null);
  const test = await registry.queryFilter(testFilter);
  return test.map(event => event.args && event.args.vault);
}
