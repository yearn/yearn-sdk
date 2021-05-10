const Table = require("cli-table3");

const { JsonRpcProvider } = require("@ethersproject/providers");

const { Yearn } = require("../dist");

const url = process.env.WEB3_PROVIDER || "http://localhost:8545";
const provider = new JsonRpcProvider(url);

const yearn = new Yearn(1, { provider });

async function main() {
  // Get all vaults in the current network
  const vaults = await yearn.vaults.get();

  const vaultsTable = new Table();
  vaultsTable.push(...vaults.map(vault => [vault.name, vault.address, vault.typeId]));

  console.log("V1 & V2 vaults:");
  console.log(vaultsTable.toString());

  // Get all vaults in the current network
  const ironBank = await yearn.ironBank.get();

  const ironBankTable = new Table();
  ironBankTable.push(...ironBank.map(market => [market.name, market.address, market.typeId]));

  console.log("IronBank markets:");
  console.log(ironBankTable.toString());

  // Get position of user for all the assets in this network
  const gov = "0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52";
  const positions = await yearn.vaults.positionsOf(gov);

  const positionsTable = new Table();
  positionsTable.push(
    ...positions.map(position => {
      const vault = vaults.find(vault => (vault.address = position.assetAddress));
      return [vault.name, position.balance];
    })
  );

  console.log("Yearn Multisig positions:");
  console.log(positionsTable.toString());

  // // ONLY ETH

  // Get all tokens supported by zapper
  const yfiVault = vaults.find(vault => vault.name === "YFI yVault").address;
  const apy = await yearn.vaults.apy(yfiVault);
  console.log("YFI yVault APY:");
  console.log(apy);

  // Get all tokens supported by zapper
  const supported = await yearn.tokens.supported();
  console.log("SDK supported tokens:", supported.length);

  // Get gas prices by zapper
  const gas = await yearn.services.zapper.gas();
  console.log("Current Gas:");
  console.log(gas);

  // Get token balances for common coins in ETH mainnet
  const balances = await yearn.services.zapper.balances(gov);

  const balancesTable = new Table();
  balancesTable.push(...balances.map(balance => [balance.token.name, balance.balance, balance.balanceUsdc]));

  console.log("Yearn Multisig token balances:");
  console.log(balancesTable.toString());
}

main();
