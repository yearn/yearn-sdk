import { Address, Integer, Usdc } from "../common";
import { ERC20 } from "./asset";

export interface GasPrice {
  standard: number;
  instant: number;
  fast: number;
}

export interface Balance {
  address: Address;
  token: ERC20;
  balance: Integer;
  balanceUsdc: Usdc;
  price: Integer;
}

export type BalancesMap<T extends Address> = { [K in T]: Balance[] };

export interface Apy {
  recommended: number;
  composite: boolean;
  type: string;
  description: string;
  data?: Record<string, unknown>;
}

export type ApiVault = Record<string, unknown>;
