const { JsonRpcProvider } = require("@ethersproject/providers");

const { Yearn } = require("..");

const provider = new JsonRpcProvider("https://rpcapi.fantom.network");
const yearn = new Yearn(250, provider);

async function main() {
  const registries = await yearn.lens.getRegistries();

  console.log(`Loaded ${registries.length} registries`);

  const assets = await yearn.lens.getAssets();

  const ape = "0xe120be880d79aded4cdbf6f2f9ef880987c82dc8";
  const positions = await yearn.lens.getPositions(ape);

  console.log(`Position of ${ape}:`);

  for (const position of positions) {
    const asset = assets.find(asset => asset.id === position.assetId);

    console.log(`- ${asset.name} (${asset.version})`);
    console.log(`\tdeposited: ${position.depositedBalance.toString()}`);
    console.log(`\tvault token balance: ${position.tokenBalance.toString()}`);
    console.log(
      `\tvault token allowance: ${position.tokenAllowance.toString()}`
    );
  }
}

main();
