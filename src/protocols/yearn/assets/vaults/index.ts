// import { Asset } from "../../../interfaces";
import pLimit from "p-limit";

import { Context } from "../../../../data/context";
import { Asset, Assets } from "../../../interfaces";
import utils from "../";
import { Vault } from "../vault/interfaces";
import excludeList from "./excludeList.json";
// import { Apy } from "../../../interfaces";
const limit = pLimit(2);

export async function fetchAll(ctx: Context): Promise<Assets> {
  let v1Addresses = await utils.vault.fetchV1Addresses(ctx);
  let v2Addresses = await utils.vault.fetchV2Addresses(ctx);
  const v2ExperimentalAddresses = await utils.vault.fetchV2ExperimentalAddresses(
    ctx
  );

  v1Addresses = v1Addresses.filter(address => !excludeList.includes(address));
  v2Addresses = v2Addresses.filter(address => !excludeList.includes(address));

  // eslint-disable-next-line
  console.log(
    "Fetching",
    v1Addresses.length,
    "v1 vaults",
    v2Addresses.length,
    "v2 vaults",
    v2ExperimentalAddresses.length,
    "v2 experimental vaults"
  );

  const vaults = await Promise.all(
    v1Addresses
      .map<Promise<Vault>>(address =>
        limit(async () => {
          return await utils.vault.resolveV1(address, ctx);
        })
      )
      .concat(
        v2Addresses.map(address =>
          limit(async () => {
            const vault = await utils.vault.resolveV2(address, ctx);
            return { ...vault, endorsed: true };
          })
        )
      )
    // TODO: Re-enable.. disabled for testing
    // .concat(
    //   v2ExperimentalAddresses.map(address =>
    //     limit(async () => {
    //       const vault = await utils.vault.resolveV2(address, ctx);
    //       return { ...vault, endorsed: false };
    //     })
    //   )
    // )
  );

  const injectApy = (vault: Vault) =>
    limit(async () => {
      let apy;
      try {
        apy = await utils.vault.calculateApy(vault, ctx);
      } catch (err) {
        // console.error(vault, err);
      }
      const asset: Asset = {
        name: vault.name,
        address: vault.address,
        apy
        // category: "deposit",
        // subcategory: "vault"
      };
      return asset;
    });

  const assets = await Promise.all(vaults.map(injectApy));
  return assets;
}
