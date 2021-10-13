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
  const usr = "0xEab23c1E3776fAd145e2E3dc56bcf739f6e0a393";
  const result = await yearn.simulation.deposit(
    usr,
    "0x111111111117dC0aa78b770fA6A738034120C302",
    "1000000000000000000000",
    "0xB8C3B7A2A618C552C23B1E4701109a9E756Bab67",
    { slippage: 0.03 }
  );
  console.log(result);
}

main();
