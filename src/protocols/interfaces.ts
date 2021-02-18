import { Context } from "@data/context";

import { Apy } from "./common/apy";

export interface Summary extends Metadata {
  tvl?: number;
}

export interface Metadata {
  name: string;
  website: string;
  token: string;
}

export interface Asset {
  name: string;
  address: string;
  tvl?: number;
  apy?: Apy;
}

export type Assets = [...Array<Asset>];

export interface Project {
  summary(ctx: Context): Promise<Summary>;
  assets(ctx: Context): Promise<Assets>;
}
