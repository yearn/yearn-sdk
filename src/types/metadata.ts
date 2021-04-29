import { Address, Integer } from "../common";

export interface VaultV2Metadata {
  symbol: string;
  pricePerShare: Integer;
  migrationAvailable: boolean;
  latestVaultAddress: Address;
  depositLimit: Integer;
  emergencyShutdown: boolean;
}

export interface VaultV1Metadata {
  controller: Address;
  totalAssets: Integer;
  totalSupply: Integer;
  pricePerShare: Integer;
}

export type Metadata = {
  VAULT_V2: VaultV2Metadata;
  VAULT_V1: VaultV1Metadata;
};

export type TypeId = keyof Metadata;
