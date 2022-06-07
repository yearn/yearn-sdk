import { Address, Integer, Usdc } from "./common";
import { Metadata, TokenMetadata, TypeId } from "./metadata";

export interface Allowance {
  owner: Address;
  spender: Address;
  amount: Integer;
}

export interface ERC20 {
  address: Address;
  name: string;
  symbol: string;
  decimals: Integer;
}

export interface TokenAmount {
  amount: Integer;
  amountUsdc: Usdc;
}

export interface Token extends ERC20 {
  icon?: string;
  priceUsdc: Usdc;
  dataSource: TokenDataSource;
  supported: {
    zapper?: boolean;
    zapperZapIn?: boolean;
    zapperZapOut?: boolean;
    ftmApeZap?: boolean;
    vaults?: boolean;
    ironBank?: boolean;
    labs?: boolean;
    votingEscrow?: boolean;
    gauge?: boolean;
  };
  metadata?: TokenMetadata;
}

export interface ZapperToken {
  address: string;
  canExchange?: boolean;
  decimals: number;
  hide?: boolean;
  price: number;
  symbol: string;
}

/**
 * Representation of a user position in a particular asset.
 */
export interface Position {
  assetAddress: Address;
  tokenAddress: Address;
  typeId: string;
  balance: Integer;
  underlyingTokenBalance: TokenAmount;
  assetAllowances: Allowance[];
  tokenAllowances: Allowance[];
}

/**
 * Part of a full [[Asset]]. Represents the part of the asset that will remain
 * the same over time (and can be cached indefinitely).
 */
export interface AssetStatic<T extends TypeId> {
  address: Address;
  typeId: T;
  token: Address;
  name: string;
  version: string;
  symbol: string;
  decimals: string;
}

/**
 * Part of a full [[Asset]]. Represents the part of the asset that will change
 * over time, especially after state-altering method is called on the asset.
 * This structure should generally not be cached.
 */
export interface AssetDynamic<T extends TypeId> {
  address: Address;
  typeId: T;
  tokenId: Address;
  underlyingTokenBalance: TokenAmount;
  metadata: Metadata[T];
}

/**
 * Union of both [[AssetStatic]] and [[AssetDynamic]] parts.
 *
 * @dev `{ typeId: T }` is included in the union to make `Metadata[T]` work.
 */
export type Asset<T extends TypeId> = AssetStatic<T> & AssetDynamic<T> & { typeId: T };

/**
 * Possible assets that lens can return.
 */
export type GenericAsset =
  | Asset<"VAULT_V1">
  | Asset<"VAULT_V2">
  | Asset<"IRON_BANK_MARKET">
  | Asset<"VOTING_ESCROW">
  | Asset<"GAUGE">;

export type TokenDataSource = "vaults" | "ironBank" | "zapper" | "labs" | "sdk" | "votingEscrow" | "gauge";
