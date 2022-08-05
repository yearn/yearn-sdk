import { Address, Integer } from "../common";

/**
 * Simple gas prices in gwei
 */
export interface GasPrice {
  eip1559: boolean;
  standard: number;
  instant: number;
  fast: number;
}

export interface ZapOptions {
  slippage?: number;
  gas?: keyof GasPrice;
  skipGasEstimate?: boolean;
}

export interface ZapApprovalStateOutput {
  spenderAddress: Address;
  tokenAddress: Address;
  ownerAddress: Address;
  allowance: Integer;
  amount: Integer;
  isApproved: boolean;
}

export interface ZapApprovalTransactionOutput {
  data: string;
  to: Address;
  from: Address;
  gasPrice: Integer;
}

export interface ZapOutput {
  to: Address;
  from: Address;
  data: string;
  value: string;
  sellTokenAddress: Address;
  sellTokenAmount: Integer;
  buyTokenAddress: Address;
  minTokens: Integer;
  gasPrice: Integer;
  gas: Integer;
}

export enum ZapProtocol {
  PICKLE = "pickle",
  YEARN = "yearn",
}

type VaultTokenMarketDataCategory = "deposit" | "pool" | "wallet";

export interface VaultTokenMarketData {
  address: Address;
  appId: "yearn";
  appImageUrl: string;
  appName: "Yearn";
  apy?: number;
  category: VaultTokenMarketDataCategory;
  decimals: number;
  img: string;
  isBlocked: boolean;
  label: string;
  liquidity: number;
  network: "ethereum";
  price: number;
  pricePerShare: number;
  protcolDisplay: "Yearn";
  supply: number;
  symbol: string;
  tokens: VaultTokenMarketDataToken[];
  type: "vault";
}

type VaultTokenMarketDataType = "base" | "interest-bearing" | "pool" | "vault";

interface VaultTokenMarketDataToken {
  address: Address;
  appId?: "yearn";
  appImageUrl?: string;
  appName?: "Yearn";
  canExchange?: boolean;
  category?: VaultTokenMarketDataType;
  decimals: number;
  exchangeAddress?: Address;
  fee?: number;
  hide?: boolean;
  img?: string;
  implementation?: "factoryV2";
  label?: string;
  liquidity?: number;
  network: "ethereum";
  price: number;
  protcolDisplay?: "Yearn";
  reserve: number;
  supply?: number;
  symbol: string;
  tokenImageUrl?: string;
  tokens?: unknown[]; // it goes a few levels deep
  type: VaultTokenMarketDataType;
  volume?: number | null;
}
