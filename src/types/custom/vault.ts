import { Address, TypedMap } from "../common";

export interface Apy {
  recommended: number;
  composite: boolean;
  type: string;
  description: string;
  data?: Record<string, unknown>;
}

export type ApyMap<T extends Address> = TypedMap<T, Apy | undefined>;

export interface ApiVault {
  address: string;
  apy?: Apy;
}
