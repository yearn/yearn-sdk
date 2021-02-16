import { Context } from "../../data/context";
import { sumTvl } from "../common";
import { Assets, Metadata, Project, Summary } from "../interfaces";
import * as vaults from "./vaults";

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
  return await vaults.fetchAll(ctx);
}

const project: Project = {
  summary,
  assets
};

export { project };
