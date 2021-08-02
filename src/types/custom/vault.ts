import { Address, Integer, TypedMap, Usdc } from "../common";
import { AssetHistoricEarnings } from "./earnings";
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

export interface VaultsUserSummary {
  holdings: Usdc;
  earnings: Usdc;
  grossApy: number;
  estimatedYearlyYield: Integer;
}

export interface VaultSummary {
  vault: Address;
  holdings: Usdc;
  earnings: Usdc;
  grossApy: number;
  historicData: AssetHistoricEarnings;
}

export interface StrategyMetadata {
  name: string;
  description: string;
  link: string;
}

export interface VaultUserMetadata {
  assetAddress: Address;
  earned: Usdc;
}
