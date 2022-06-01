import { BigNumber } from "@ethersproject/bignumber";
import { PartialDeep } from "type-fest";

import { Vault } from "..";
import { Address, Integer, TypedMap, Usdc } from "../common";
import { ZapOptions } from "./zapper";

/**
 * Annual Percentage Yield of a particular for backscratcher vaults coming from api.yearn.finance.
 */
export interface BackscracherApyComposite {
  currentBoost: number;
  boostedApy: number;
  totalApy: number;
  poolApy: number;
  baseApy: number;
}

/**
 * Annual Percentage Yield of a particular vault.
 */
export interface Apy {
  type: string;
  grossApr: number;
  netApy: number;
  fees: {
    performance: number | null;
    withdrawal: number | null;
    management: number | null;
    keepCrv: number | null;
    cvxKeepCrv: number | null;
  };
  points: {
    weekAgo: number;
    monthAgo: number;
    inception: number;
  } | null;
  composite: {
    boost: number;
    poolApy: number;
    boostedApr: number;
    baseApr: number;
    cvxApr: number;
    rewardsApr: number;
  } | null;
}

export type ApyMap<T extends Address> = TypedMap<T, Apy | undefined>;

export type DepositOptions = ZapOptions;
export interface WithdrawOptions extends ZapOptions {
  signature?: string;
}

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

export type ZappableVault = {
  address: Address;
  token: Address;
  decimals: Integer;
  metadata: {
    zapInWith?: string;
    zapOutWith?: string;
    pricePerShare: Integer;
  };
} & PartialDeep<Vault>;

export interface VaultInfo {
  name: string;
  symbol: string;
  apiVersion: string;
  emergencyShutdown: boolean;
  lastReport: Date;
  managementFee: BigNumber;
  performanceFee: BigNumber;
  totalAssets: BigNumber;
  depositLimit: BigNumber;
  debtRatio: BigNumber;
  management: Address;
  governance: Address;
  guardian: Address;
  rewards: Address;
}
