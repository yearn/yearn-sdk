const { JsonRpcProvider } = require("@ethersproject/providers");

const { Yearn } = require("../dist");

const id = process.env.WEB3_ALCHEMY_PROJECT_ID;
const provider = new JsonRpcProvider(
  `https://eth-mainnet.alchemyapi.io/v2/${id}`
);

const yearn = new Yearn(1, { provider });

const yearn2 = new Yearn(1, { provider });

async function main() {
  // Get all vaults in the current network
  const vaults = await yearn.vaults.get();
  console.log(vaults);
  console.log(`Found ${vaults.length} v2 production vault`);

  // Get all underlying tokens in the current network
  const tokens = await yearn.vaults.tokens();
  console.log(tokens);

  // Get position of user for all the assets in this network
  const user = "0x8aB0fE3d61E372A0cAa2b2AcF6D1ffDeFD1c645A";
  const positions = await yearn.vaults.positionsOf(user);
  console.log(positions);

  // ONLY ETH

  // Get all tokens supported by zapper
  const usdcVault = vaults[0].id;
  const apy = await yearn.vaults.apy(usdcVault);
  console.log(apy);

  // Get all tokens supported by zapper
  const supported = await yearn.services.zapper.supportedTokens();
  console.log(supported.find(token => token.name === "YFI"));

  // Get gas prices by zapper
  const gas = await yearn.services.zapper.gas();
  console.log(gas);

  // Get token balances for common coins in ETH mainnet
  const gov = "0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52";
  const balances = await yearn.services.zapper.balances(gov);
  console.log(balances);
}

main();
