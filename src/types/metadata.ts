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
  v2Vault: VaultV2Metadata;
  v1Vault: VaultV1Metadata;
};

export type TypeId = keyof Metadata;
