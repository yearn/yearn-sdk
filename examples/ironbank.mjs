import Table from "cli-table3";

import { JsonRpcProvider } from "@ethersproject/providers";
import { YearnGovernance, Addresses } from "./common.mjs";

import { Yearn } from "../dist/index.js";

const url = process.env.WEB3_PROVIDER || "http://localhost:8545";
const provider = new JsonRpcProvider(url);

const yearn = new Yearn(1, {
  provider,
  addresses: Addresses,
});

async function main() {
  const ironBank = await yearn.ironBank.get();

  const ironBankTable = new Table();
  ironBankTable.push(...ironBank.map((market) => [market.name, market.address, market.typeId]));

  console.log("IronBank markets:");
  console.log(ironBankTable.toString());

  const ironBankGeneralPositionTable = new Table();
  const ironBankGeneralPosition = await yearn.ironBank.generalPositionOf(YearnGovernance);

  ironBankGeneralPositionTable.push(...Object.entries(ironBankGeneralPosition));
  console.log("Yearn Multisig general IronBank position:");
  console.log(ironBankGeneralPositionTable.toString());

  const ironBankUserMetadataTable = new Table();
  const ironBankUserMetadata = await yearn.ironBank.userMetadata(YearnGovernance);

  ironBankUserMetadataTable.push(...ironBankUserMetadata.map((market) => Object.values(market)));
  console.log("Yearn Multisig IronBank user metadata:");
  console.log(ironBankUserMetadataTable.toString());
}

main();
