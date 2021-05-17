const Table = require("cli-table3");

const { JsonRpcProvider } = require("@ethersproject/providers");

const { Yearn } = require("../dist");

const url = process.env.WEB3_PROVIDER || "http://localhost:8545";
const provider = new JsonRpcProvider(url);

const yearn = new Yearn(1, {
  provider,
  addresses: {
    adapters: {
      registryV2: "0xFbD588c72B438faD4Cf7cD879c8F730Faa213Da0",
      ironBank: "0xed00238F9A0F7b4d93842033cdF56cCB32C781c2"
    },
    helper: "0x420b1099B9eF5baba6D92029594eF45E19A04A4A",
    oracle: "0xE7eD6747FaC5360f88a2EFC03E00d25789F69291"
  }
});

async function main() {
  const gov = "0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52";

  // VAULTS V1 & V2
  const vaults = await yearn.vaults.get();

  const vaultsTable = new Table();
  vaultsTable.push(...vaults.map(vault => [vault.name, vault.address, vault.typeId]));

  console.log("V1 & V2 vaults:");
  console.log(vaultsTable.toString());

  const positions = await yearn.vaults.positionsOf(gov);

  const positionsTable = new Table();
  positionsTable.push(
    ...positions.map(position => {
      const vault = vaults.find(vault => (vault.address = position.assetAddress));
      return [vault.name, position.balance];
    })
  );

  console.log("Yearn Multisig vault positions:");
  console.log(positionsTable.toString());

  // Get token balances for common coins in ETH mainnet
  const vaultBalances = await yearn.vaults.balances(gov);

  const vaultBalancesTable = new Table();
  vaultBalancesTable.push(...vaultBalances.map(balance => [balance.token.name, balance.balance, balance.balanceUsdc]));

  console.log("Yearn Multisig underlying vault tokens balances:");
  console.log(vaultBalancesTable.toString());
  
  // IRON BANK
  const ironBank = await yearn.ironBank.get();

  const ironBankTable = new Table();
  ironBankTable.push(...ironBank.map(market => [market.name, market.address, market.typeId]));

  console.log("IronBank markets:");
  console.log(ironBankTable.toString());

  const ironBankGeneralPositionTable = new Table();
  const ironBankGeneralPosition = await yearn.ironBank.generalPositionOf(gov);

  ironBankGeneralPositionTable.push(...Object.entries(ironBankGeneralPosition));
  console.log("Yearn Multisig general IronBank position:");
  console.log(ironBankGeneralPositionTable.toString());

  const ironBankUserMetadataTable = new Table();
  const ironBankUserMetadata = await yearn.ironBank.userMetadata(gov);

  ironBankUserMetadataTable.push(...ironBankUserMetadata.map(market => Object.values(market)));
  console.log("Yearn Multisig IronBank user metadata:");
  console.log(ironBankUserMetadataTable.toString());

  // ONLY ETH

  // Get all tokens supported by zapper
  const supported = await yearn.tokens.supported();
  console.log("SDK supported tokens:", supported.length);

  // Get token balances for common coins in ETH mainnet
  const balances = await yearn.tokens.balances(gov);

  const balancesTable = new Table();
  balancesTable.push(...balances.map(balance => [balance.token.name, balance.balance, balance.balanceUsdc]));

  console.log("Yearn Multisig token balances:");
  console.log(balancesTable.toString());
}

main();
