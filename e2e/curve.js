require("dotenv/config");

const { WebSocketProvider } = require("@ethersproject/providers");

const yearn = require("..");

const provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS);
const etherscan = process.env.ETHERSCAN_KEY;

const ctx = new yearn.Context({ provider, etherscan });

async function main() {
  const v1 = await yearn.vault.fetchV1Addresses(ctx);
  console.log(`Fetching ${v1.length} v1 vaults`);
  for (const address of v1) {
    const vault = await yearn.vault.resolveV1(address, ctx);
    const token = vault.token.address;
    if (await yearn.legos.curve.isToken(token, ctx)) {
      const apy = await yearn.legos.curve.calculatePoolApy(token, ctx);
      console.log(vault.name, apy);
    }
  }

  await provider.destroy();
}

main();
