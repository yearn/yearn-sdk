import { Address, TypedMap } from "../common";
import { ZapOptions } from "./zapper";

/**
 * Annual Percentage Yield of a particular vault.
 */
export interface Apy {
  recommended: number;
  composite: boolean;
  type: string;
  description: string;
  data?: Record<string, unknown>;
}

export type ApyMap<T extends Address> = TypedMap<T, Apy | undefined>;

export interface DepositOptions extends ZapOptions {}
export interface WithdrawOptions extends ZapOptions {}
