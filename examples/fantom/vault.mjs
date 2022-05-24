import { JsonRpcProvider } from "@ethersproject/providers";

import { Yearn } from "../../dist/index.js";
import { Addresses } from "../common.mjs";

const url = "https://rpc.ftm.tools/";
const provider = new JsonRpcProvider(url);

const yearn = new Yearn(250, {
  provider,
  addresses: Addresses,
  cache: { useCache: false },
});

async function main() {
  const result = await yearn.strategies.getHarvests("0xA9a904B5567b5AFfb6bB334bea2f90F700EB221a");
  console.log(result);
  // const vaults = await yearn.vaults.getDynamic();
  // console.log(vaults);
  // const tokenMetadata = await yearn.services.meta.token("0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83");
  // console.log(tokenMetadata);
  // const vaultMetadata = await yearn.services.meta.vaults("0x1DF3f4985Ac2103B96ed75f9d76F33696D2b1d66");
  // console.log(vaultMetadata);
}

main();
