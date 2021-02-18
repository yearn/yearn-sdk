require("dotenv/config");

const { WebSocketProvider } = require("@ethersproject/providers");

const sdk = require("..");
const yearn = sdk.protocols.yearn;

const provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS);
const etherscan = process.env.ETHERSCAN_KEY;

const AAVEVault = '0x03403154afc09Ce8e44C3B185C82C6aD5f86b9ab';

const ctx = new sdk.Context({ provider, etherscan });

async function main() {
  const vault = await yearn.vault.resolveV1(AAVEVault, ctx);
  const apy = await yearn.vault.calculateApy(vault, ctx);
  console.log(apy);

  await provider.destroy();
}

main();
