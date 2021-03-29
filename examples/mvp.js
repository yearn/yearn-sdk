const { JsonRpcProvider } = require("@ethersproject/providers");

const { Yearn } = require("../dist");

const provider = new JsonRpcProvider("https://rpcapi.fantom.network");
const yearn = new Yearn(250, provider);

async function main() {
  const vaults = await yearn.vaults.get();
  const tokens = await yearn.vaults.getTokens();
  const positions = await yearn.vaults.getPositionsOf(
    "0x8aB0fE3d61E372A0cAa2b2AcF6D1ffDeFD1c645A"
  );

  console.log(vaults);
  console.log(tokens);
  console.log(positions);
}

main();
