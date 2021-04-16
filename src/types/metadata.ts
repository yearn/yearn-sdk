import { BigNumber } from "@ethersproject/bignumber";

import { Address } from "../common";

export interface VaultV2Metadata {
  symbol: string;
  pricePerShare: BigNumber;
  migrationAvailable: boolean;
  latestVaultAddress: Address;
  depositLimit: BigNumber;
  emergencyShutdown: boolean;
}

export interface VaultV1Metadata {
  controller: Address;
  totalAssets: BigNumber;
  totalSupply: BigNumber;
  pricePerShare: BigNumber;
}

export type Metadata = {
  VAULT_V2: VaultV2Metadata;
  VAULT_V1: VaultV1Metadata;
};

export type TypeId = keyof Metadata;
