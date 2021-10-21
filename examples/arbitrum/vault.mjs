import { JsonRpcProvider } from "@ethersproject/providers";

import { Yearn } from "../../dist/index.js";
import { Addresses } from "../common.mjs";

const url = "https://arb1.arbitrum.io/rpc";
const provider = new JsonRpcProvider(url);

const yearn = new Yearn(42161, {
  provider,
  addresses: Addresses,
  cache: { useCache: false }
});

async function main() {
  const vaults = await yearn.vaults.getStatic();
  console.log(vaults);
}

main();
