const { InfuraProvider } = require("@ethersproject/providers");

const { Oracle } = require("..");

const provider = new InfuraProvider();
const oracle = new Oracle(1, provider);

const dai = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

async function main() {
  const price = await oracle.getPriceUsdcRecommended(dai);
  console.log(`Dai price is ${price} / 1e6 USDC`);

  const markets = await oracle.getIronBankMarkets();
  console.log(markets)
}

main();
