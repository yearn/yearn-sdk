const { JsonRpcProvider } = require("@ethersproject/providers");

const { Yearn } = require("../dist");

const provider = new JsonRpcProvider("https://rpcapi.fantom.network");
const yearn = new Yearn(250, { provider });

async function main() {
  // const vaults = await yearn.vaults.get();
  // const tokens = await yearn.vaults.getTokens();
  // const positions = await yearn.vaults.getPositionsOf(
  //   "0x8aB0fE3d61E372A0cAa2b2AcF6D1ffDeFD1c645A"
  // );

  const supported = await yearn.services.zapper.supportedTokens();
  console.log(supported);

  const gas = await yearn.services.zapper.gas();
  console.log(gas);

  const user = "0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52";
  const balances = await yearn.services.zapper.balances(user);
  console.log(balances);

  // console.log(vaults);
  // console.log(tokens);
  // console.log(positions);
}

main();
