const { InfuraProvider } = require("@ethersproject/providers");

const yearn = require("..");

const provider = new InfuraProvider();

const dai = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

async function main() {
  const price = await yearn.oracle.getPriceUsdcRecommended(dai, provider);
  console.log(`Dai price is ${price} / 1e6 USDC`);

  const markets = await yearn.oracle.getIronBankMarkets(provider);
  console.log(markets)
}

main();
