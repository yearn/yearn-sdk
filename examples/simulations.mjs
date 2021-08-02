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
  // const gasLimit = 8000000;

  // const result = await yearn.simulation.simulationExecutor.simulateRaw(
  //   "0xD185A98e4fEDB6Aed6cfaf2e87deafEc53b34c78",
  //   "0xE14d13d8B3b85aF791b2AADD661cDBd5E6097Db1",
  //   "0xe63697c8000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000d185a98e4fedb6aed6cfaf2e87deafec53b34c78000000000000000000000000000000000000000000000000000000174876e7ff",
  //   "0",
  //   false
  // );

  // return;

  // const directDeposit = await yearn.simulation.deposit(
  //   "0xD185A98e4fEDB6Aed6cfaf2e87deafEc53b34c78",
  //   "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  //   "30000000",
  //   yfiVault,
  //   undefined,
  //   0.03
  // );
  // console.log(directDeposit);

  // const ethWithdraw = await yearn.simulation.withdraw(usr2, yfiVault, "1000000000000000000", ethToken, undefined, 0.02);
  // console.log(ethWithdraw);

  // const directWithdraw = await yearn.simulation.withdraw(usr2, yfiVault, "1000000000000000000", yfiToken);
  // console.log(directWithdraw);

  const directDeposit = await yearn.simulation.deposit(usr1, yfiToken, "1000000000000000000", yfiVault);
  console.log(directDeposit);

  const ethWithdraw = await yearn.simulation.withdraw(usr2, yfiVault, "1000000000000000000", ethToken, undefined, 0.02);
  console.log(ethWithdraw);

  const directWithdraw = await yearn.simulation.withdraw(
    usr2,
    yfiVault,
    "1000000000000000000",
    yfiToken,
    undefined,
    0.02
  );
  console.log(directWithdraw);
}

main();
