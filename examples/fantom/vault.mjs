import { JsonRpcProvider } from "@ethersproject/providers";

import { Yearn } from "../../dist/index.js";
import { Addresses } from "../common.mjs";

const url = "https://rpc.ftm.tools/";
const provider = new JsonRpcProvider(url);

const yearn = new Yearn(250, {
  provider,
  addresses: Addresses
});

async function main() {
  const vaults = await yearn.vaults.getDynamic();
  console.log(vaults);
}

main();
