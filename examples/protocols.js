require("dotenv/config");

const { WebSocketProvider } = require("@ethersproject/providers");

const sdk = require("..");

const provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS);
const etherscan = process.env.ETHERSCAN_KEY;

const ctx = new sdk.Context({ provider, etherscan });

async function main() {
  // const summary = await sdk.protocols.yearn.summary(ctx);
  const assets = await sdk.protocols.yearn.assets(ctx);
  // console.log("summary", summary);
  console.log("assets", assets);
  await provider.destroy();
}

main();
