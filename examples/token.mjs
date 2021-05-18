import Table from "cli-table3";

import { JsonRpcProvider } from "@ethersproject/providers";
import { YearnGovernance, Addresses } from "./common.mjs";

import { Yearn } from "../dist/index.js";

const url = process.env.WEB3_PROVIDER || "http://localhost:8545";
const provider = new JsonRpcProvider(url);

const yearn = new Yearn(1, {
  provider,
  addresses: Addresses
});

async function main() {
  // Get all tokens supported by zapper
  const supported = await yearn.tokens.supported();
  console.log("Zapper supported tokens:", supported.length);

  // Get token balances for common coins in ETH mainnet
  const balances = await yearn.tokens.balances(YearnGovernance);

  const balancesTable = new Table();
  balancesTable.push(...balances.map(balance => [balance.token.name, balance.balance, balance.balanceUsdc]));

  console.log("Yearn Multisig token balances:");
  console.log(balancesTable.toString());
}

main();
