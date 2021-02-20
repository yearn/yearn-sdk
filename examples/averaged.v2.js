require("dotenv/config");

const { WebSocketProvider } = require("@ethersproject/providers");

const { Context, yearn, curve } = require("..");

const provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS);
const etherscan = process.env.ETHERSCAN_KEY;

const ECRVVault = "0x986b4AFF588a109c09B50A03f42E4110E29D353F";

const ctx = new Context({ provider, etherscan });

async function main() {
  const vault = await yearn.vault.resolveV2(ECRVVault, ctx);
  const apy1 = await yearn.vault.apy.calculate(vault, ctx);
  console.log(vault.name, `${(apy1.data.inceptionSample * 100).toFixed(4)}%`);

  await provider.destroy();
}

main();