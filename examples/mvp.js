const { JsonRpcProvider } = require("@ethersproject/providers");

const { Yearn } = require("../dist");

const url = process.env.WEB3_PROVIDER || "http://localhost:8545";
const provider = new JsonRpcProvider(url);

const yearn = new Yearn(1, { provider });

async function main() {
  // Get all vaults in the current network
  const vaults = await yearn.vaults.get();
  console.log(vaults);
  console.log(`Found ${vaults.length} v2 production vault`);

  // Get position of user for all the assets in this network
  const user1 = "0x8aB0fE3d61E372A0cAa2b2AcF6D1ffDeFD1c645A";
  const user2 = "0x7A1057E6e9093DA9C1D4C1D049609B6889fC4c67";
  await yearn.vaults.positionsOf(user1);
  await yearn.vaults.positionsOf(user2);
  await yearn.vaults.positionsOf(user1);

  // ONLY ETH

  // Get all tokens supported by zapper
  const usdcVault = vaults[0].address;
  const apy = await yearn.vaults.apy(usdcVault);
  console.log(apy);

  // Get all tokens supported by zapper
  const supported = await yearn.tokens.supported();
  console.log(supported);

  // Get gas prices by zapper
  const gas = await yearn.services.zapper.gas();
  console.log(gas);

  // Get token balances for common coins in ETH mainnet
  const gov = "0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52";
  const balances = await yearn.services.zapper.balances(gov);
  console.log(balances);
}

main();
