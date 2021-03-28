import { BigNumber } from "@ethersproject/bignumber";

import { Address } from "./common";

export type Metadata = {
  VAULT_V2: {
    symbol: string;
    pricePerShare: BigNumber;
    migrationAvailable: boolean;
    latestVaultAddress: Address;
    depositLimit: BigNumber;
    emergencyShutdown: boolean;
  };
  VAULT_V1: {
    controller: Address;
    totalAssets: BigNumber;
    totalSupply: BigNumber;
    pricePerShare: BigNumber;
  };
};

export type SpecificAsset<T extends keyof Metadata> = {
  id: Address;
  name: string;
  version: string;
  balance: BigNumber;
  balanceUsdc: BigNumber;
  token: Token;
  type: T;
  metadata: Metadata[T];
};

export interface Token {
  id: Address;
  name: string;
  symbol: string;
  decimals: BigNumber;
}

export type Asset = SpecificAsset<"VAULT_V1"> | SpecificAsset<"VAULT_V2">;
