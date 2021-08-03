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
  const usr1 = "0x7A1057E6e9093DA9C1D4C1D049609B6889fC4c67";
  const usr2 = "0x4F76fF660dc5e37b098De28E6ec32978E4b5bEb6";
  const yfiVault = "0xE14d13d8B3b85aF791b2AADD661cDBd5E6097Db1";
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
