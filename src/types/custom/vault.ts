import { Address, Integer, TypedMap, Usdc } from "../common";
import { ZapOptions } from "./zapper";

/**
 * Annual Percentage Yield of a particular vault.
 */
export interface Apy {
  type: string;
  gross_apr: number;
  net_apy: number | string;
  fees: {
    performance: number | null;
    withdrawal: number | null;
    management: number | null;
    keep_crv: number | null;
    cvx_keep_crv: number | null;
  };
  points: {
    week_ago: number;
    month_ago: number;
    inception: number;
  } | null;
  composite: {
    boost: number;
    pool_apy: number;
    boosted_apr: number;
    base_apr: number;
    cvx_apr: number;
    rewards_apr: number;
  } | null;
}

export type ApyMap<T extends Address> = TypedMap<T, Apy | undefined>;

export interface DepositOptions extends ZapOptions {}
export interface WithdrawOptions extends ZapOptions {}

export interface VaultsUserSummary {
  holdings: Usdc;
  earnings: Usdc;
  grossApy: number;
  estimatedYearlyYield: Integer;
}

export interface VaultUserMetadata {
  assetAddress: Address;
  earned: Usdc;
}
