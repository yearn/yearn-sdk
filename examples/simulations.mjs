import { JsonRpcProvider } from "@ethersproject/providers";

import { Yearn } from "../dist/index.js";
import { Addresses } from "./common.mjs";

const url = process.env.WEB3_PROVIDER || "http://localhost:8545";
const provider = new JsonRpcProvider(url);

const yearn = new Yearn(1, {
  provider,
  addresses: Addresses
});

async function main() {
  const usr1 = "0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE";
  const usr2 = "0x73faf4be6cb43489b8f6e8a4ed3ccd804eb18586";
  const yfiVault = "0xdb25cA703181E7484a155DD612b06f57E12Be5F0";
  const yfiToken = "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e";

  const ethToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  const directDeposit = await yearn.simulation.deposit(usr1, yfiToken, "1000000000000000000", yfiVault);
  console.log(directDeposit);

  const ethWithdraw = await yearn.simulation.withdraw(usr2, yfiVault, "1000000000000000000", ethToken, {
    slippage: 0.02
  });
  console.log(ethWithdraw);

  const directWithdraw = await yearn.simulation.withdraw(usr2, yfiVault, "1000000000000000000", yfiToken, {
    slippage: 0.02
  });
  console.log(directWithdraw);
}

main();
