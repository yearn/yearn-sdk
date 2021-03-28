const { JsonRpcProvider } = require("@ethersproject/providers");

const { Yearn } = require("../dist");

const provider = new JsonRpcProvider("https://rpcapi.fantom.network");
const yearn = new Yearn(250, provider);

async function main() {
  const vaults = await yearn.vaults.getVaults();
  const tokens = await yearn.vaults.getVaultTokens();
  
  console.log(vaults);
  console.log(tokens);
}

main();
