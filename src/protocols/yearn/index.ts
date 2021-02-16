import { Context } from "../../data/context";
import { sumTvl } from "../common";
import { Assets, Metadata, Project, Summary } from "../interfaces";
// import { Vault } from "./assets/vault/interfaces";
import utils from "./utils";

const metadata: Metadata = {
  name: "yearn.finance",
  website: "https://yearn.finance",
  token: "0x"
};

export type FetchedVault = {
  endorsed?: boolean;
};

export async function summary(ctx: Context): Promise<Summary> {
  const assetList = await assets(ctx);
  const tvl = sumTvl(assetList);
  const summary: Summary = {
    ...metadata,
    tvl
  };
  return summary;
}

export async function assets(ctx: Context): Promise<Assets> {
  const vaults = await utils.vaults.fetchAll(ctx);
  return vaults;
}

const project: Project = {
  summary,
  assets
};

export { project };
