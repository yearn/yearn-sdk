import { Address, Integer } from "./common";
import { EarningsDayData } from "./custom/earnings";
import { Apy } from "./custom/vault";
import { VaultStrategiesMetadata } from "./strategy";

/**
 * Lens-defined metadata for Yearn Vaults (v1 & v2)
 */
export interface VaultMetadata {
  symbol: string;
  pricePerShare: Integer;
  migrationAvailable: boolean; // TODO: should be optional
  latestVaultAddress: Address;
  depositLimit: Integer;
  emergencyShutdown: boolean;

  controller: Address;
  totalAssets: Integer;
  totalSupply: Integer;

  apy?: Apy;
  displayName: string; // TODO: should be optional
  displayIcon: string;
  defaultDisplayToken: Address;
  strategies?: VaultStrategiesMetadata;
  historicEarnings?: EarningsDayData[];
  depositsDisabled?: boolean;
  withdrawalsDisabled?: boolean;
  allowZapIn?: boolean;
  allowZapOut?: boolean;
  migrationContract?: Address;
  migrationTargetVault?: Address;
  vaultNameOverride?: string;
  vaultDetailPageAssets?: string[];
  hideIfNoDeposits: boolean;
}

/**
 * Lens-defined metadata for an IronBank market.
 */
export interface IronBankMarketMetadata {
  totalSuppliedUsdc: Integer;
  totalBorrowedUsdc: Integer;
  lendAprBips: Integer;
  borrowAprBips: Integer;
  lendApyBips: Integer;
  borrowApyBips: Integer;
  liquidity: Integer;
  liquidityUsdc: Integer;
  totalCollateralTokens: Integer;
  collateralFactor: Integer;
  collateralCap: Integer;
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

/**
 * Token metadata from yearn-meta
 */
export interface TokenMetadata {
  address: Address;
  categories?: string[] | null;
  description: string;
  website: string;
  tokenIconOverride?: string;
  tokenSymbolOverride?: string | null;
  tokenNameOverride?: string | null;
  localization: Record<string, unknown>;
}

export interface StrategyMetadata {
  name: string;
  description: string;
  address: Address;
  protocols: string[];
}

export interface StrategiesMetadata {
  name: string;
  description: string;
  addresses: Address[];
  protocols: string[];
}

export interface VaultMetadataOverrides {
  address: Address;
  allowZapIn?: boolean | null;
  allowZapOut?: boolean | null;
  apyOverride?: number | null;
  apyTypeOverride?: string | null;
  comment: string;
  depositsDisabled?: boolean | null;
  displayName?: string | null;
  hideAlways: boolean;
  migrationAvailable?: boolean | null;
  migrationContract?: Address | null;
  migrationTargetVault?: Address | null;
  order?: number | null;
  retired?: boolean | null;
  useVaultDataAsDefault?: boolean | null;
  vaultDetailPageAssets?: string[];
  vaultIconOverride?: string;
  vaultNameOverride?: string;
  vaultSymbolOverride?: string;
  withdrawalsDisabled?: boolean | null;
}
