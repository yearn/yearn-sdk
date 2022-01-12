import { config } from "dotenv";
import { ChainId, Chains } from "../src/chain";

config();

export const rpcUrl: string | undefined = process.env.WEB3_PROVIDER;
if (!rpcUrl) {
  throw new Error("Please set WEB3_PROVIDER url in a .env file");
}

const _chainId = +process.env.CHAIN_ID;
if (!_chainId) {
  throw new Error("Please set CHAIN_ID in a .env file");
}
if (!(_chainId in Chains)) {
  throw new Error("Please set CHAIN_ID to one of 1, 250, 1337 or 42161");
}
export const chainId: ChainId = _chainId as ChainId;
