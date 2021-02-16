import pLimit from "p-limit";

import { Context } from "../../../data/context";
import { Asset, Assets } from "../../interfaces";
import { calculateApy } from "../vault/apy";
import { Vault } from "../vault/interfaces";
import { fetchV1Addresses, fetchV2ExperimentalAddresses } from "../vault/registry";
import { resolveV1, resolveV2 } from "../vault/resolver";
import v1exclude from "./exclude.v1.json";
import v2exclude from "./exclude.v2.json";

const limit = pLimit(2);

export async function fetchAll(ctx: Context): Promise<Assets> {
  let v1Addresses = await fetchV1Addresses(ctx);
  let v2Addresses = await fetchV1Addresses(ctx);
  const v2ExperimentalAddresses = await fetchV2ExperimentalAddresses(ctx);

  v1Addresses = v1Addresses.filter(address => !v1exclude.includes(address));
  v2Addresses = v2Addresses.filter(address => !v2exclude.includes(address));

  const vaults = await Promise.all(
    v1Addresses
      .map<Promise<Vault>>(address =>
        limit(async () => {
          return await resolveV1(address, ctx);
        })
      )
      .concat(
        v2Addresses.map(address =>
          limit(async () => {
            const vault = await resolveV2(address, ctx);
            return { ...vault, endorsed: true };
          })
        )
      )
      .concat(
        v2ExperimentalAddresses.map(address =>
          limit(async () => {
            const vault = await resolveV2(address, ctx);
            return { ...vault, endorsed: false };
          })
        )
      )
  );

  const injectApy = (vault: Vault) =>
    limit(async () => {
      let apy;
      try {
        apy = await calculateApy(vault, ctx);
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
