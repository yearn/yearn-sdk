import { RegistryV2Contract__factory } from "../../contracts";
import { Context } from "../../data/context";

const RegistryV2 = "v2.registry.ychad.eth";

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
  const prod = await fetchV2Addresses(ctx);
  return test
    .map(event => event.args && event.args.vault)
    .filter(address => !prod.includes(address));
}
