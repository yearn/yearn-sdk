import { Address, Integer, Usdc } from "./common";
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

type TypedMap<K extends string | number | symbol, V> = { [key in K]: V };

export type BalancesMap<T extends Address> = TypedMap<T, Balance[]>;

export type Icon = string | undefined;
export type IconMap<T extends Address> = TypedMap<T, Icon>;

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
