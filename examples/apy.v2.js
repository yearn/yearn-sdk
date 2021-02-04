require("dotenv/config");

const { WebSocketProvider } = require("@ethersproject/providers");

const yearn = require("..");
const { tab } = require("./helpers");

const provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS);
const etherscan = process.env.ETHERSCAN_KEY;

const ctx = new yearn.Context({ provider, etherscan });

async function main() {
  // const v1 = await yearn.vault.fetchV2Addresses(ctx);
  // console.log(`Fetching ${v1.length} v2 vaults`);
  // for (const address of v1) {
  //   const vault = await yearn.vault.resolveV2(address, ctx);
  //   const apy = await yearn.vault.calculateApy(vault, ctx);
  //   const inception = `${(apy.inceptionSample * 100).toFixed(3)}%`;
  //   const oneMonth = `${(apy.oneMonthSample * 100).toFixed(3)}%`;
  //   tab(vault.address, inception, oneMonth, vault.name);
  // }

  const registry = yearn.contracts.RegistryV2Contract__factory.connect(
    "0xBFa4D8AA6d8a379aBFe7793399D3DdaCC5bBECBB",
    ctx.provider
  );
  const tagFilter = registry.filters.VaultTagged(null, null);
  const tags = await registry.queryFilter(tagFilter);
  console.log(tags);

  await provider.destroy();
}

main();
