const { JsonRpcProvider } = require("@ethersproject/providers");

const { Yearn } = require("..");

const provider = new JsonRpcProvider("https://rpcapi.fantom.network");
const yearn = new Yearn(250, provider);

async function main() {
  const vaults = await yearn.vaults.get();
  for (const vault of vaults) {
    console.log(vault);
  }
}

main();
