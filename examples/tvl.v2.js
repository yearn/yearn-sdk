require("dotenv/config");

const { WebSocketProvider } = require("@ethersproject/providers");

const sdk = require("..");
const yearn = sdk.protocols.yearn;

const provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS);
const etherscan = process.env.ETHERSCAN_KEY;

const ctx = new sdk.Context({ provider, etherscan });

async function main() {
  const v2 = await yearn.vault.fetchV2Addresses(ctx);
  for (const address of v2) {
    const vault = await yearn.vault.resolveV2(address, ctx);
    const tvl = await yearn.vault.calculateTvlV2(vault, ctx);
    console.log(vault.name, tvl);
  }

  await provider.destroy();
}

main();
