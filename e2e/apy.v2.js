require("dotenv/config");

const { WebSocketProvider } = require("@ethersproject/providers");

const yearn = require("..");
const { tab } = require("./helpers");

const provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS);
const etherscan = process.env.ETHERSCAN_KEY;

const ctx = new yearn.Context({ provider, etherscan });

async function main() {
  const v2 = await yearn.vault.fetchV2Addresses(ctx);
  console.log(`Fetching ${v2.length} v2 vaults`);
  for (const address of v2) {
    const vault = await yearn.vault.resolveV2(address, ctx);
    const apy = await yearn.vault.calculateApy(vault, ctx);
    const inception = `${(apy.inceptionSample * 100).toFixed(3)}%`;
    const oneMonth = `${(apy.oneMonthSample * 100).toFixed(3)}%`;
    tab(vault.address, inception, oneMonth, vault.name);
  }

  await provider.destroy();
}

main();
