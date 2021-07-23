import { Address, Integer } from "./common";
import { Apy } from "./custom/vault";

/**
 * Lens-defined metadata for Yearn Vaults (v1 & v2)
 */
export interface VaultMetadata {
  symbol: string;
  pricePerShare: Integer;
  migrationAvailable: boolean;
  latestVaultAddress: Address;
  depositLimit: Integer;
  emergencyShutdown: boolean;

  controller: Address;
  totalAssets: Integer;
  totalSupply: Integer;

  apy?: Apy;
  displayName: string;
  displayIcon: string;
  defaultDisplayToken: Address;
}

/**
 * Lens-defined metadata for an IronBank market.
 */
export interface IronBankMarketMetadata {
  totalSuppliedUsdc: Integer;
  totalBorrowedUsdc: Integer;
  lendApyBips: Integer;
  borrowApyBips: Integer;
  liquidity: Integer;
  liquidityUsdc: Integer;
  collateralFactor: Integer;
  isActive: boolean;
  reserveFactor: Integer;
  exchangeRate: Integer;
}

/**
 * Key Value representation of metadata names and types.
 * Used mainly to provide correct type-guards for asset types.
 */
export type Metadata = {
  VAULT_V2: VaultMetadata;
  VAULT_V1: VaultMetadata;
  IRON_BANK_MARKET: IronBankMarketMetadata;
};

/**
 * Union type of all the existing Metadata types.
 */
export type TypeId = keyof Metadata;
