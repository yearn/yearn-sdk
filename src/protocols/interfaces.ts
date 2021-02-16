import { Context } from "@data/context";

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
  // category: "vault";
  // category: "deposit" | "staked" | "lent" | "borrowed";
  // subcategory?: "vault";
}

export type Assets = [...Array<Asset>];

export interface Project {
  summary(ctx: Context): Promise<Summary>;
  assets(ctx: Context): Promise<Assets>;
}

export interface Apy {
  recommended: number;
  composite: boolean;
  type: string;
  description: string;
  data?: Record<string, unknown>;
}

// Scoped to protocols
// WIP...

// Scoped to user
// WIP...
/**
 *               | Deposit | Withdraw |
 * ------------------------------------
 * Wallet        | No      |
 * Deposit       | Yes     |
 * Staked        |
 * Yield farming |
 * Lent
 * Borrowed
 */
