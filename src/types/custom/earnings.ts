import { TokenAmount } from "../asset";
import { Address, Usdc } from "../common";

export interface AccountSummary {
  accountId: Address;
  aggregatedApy: number;
  totalDepositedUsdc: Usdc;
  totalEarningsUsdc: Usdc;
  projectedDailyEarningsUsdc: Usdc;
}

export interface AccountAssetPosition {
  accountAddress: Address;
  assetAddress: Address;
  tokenAddress: Address;
  balance: TokenAmount;
  earnings: TokenAmount;
  roi: number;
}

export interface AssetEarnings extends TokenAmount {
  tokenAddress: Address;
  assetAddress: Address;
}

export interface AssetHistoricEarnings extends HistoricEarnings {
  assetAddress: Address;
}

export interface AccountHistoricEarnings extends HistoricEarnings {
  accountAddress: Address;
  shareTokenAddress: Address;
}

export interface HistoricEarnings {
  decimals: number;
  dayData: EarningsDayData[];
}

export interface EarningsDayData {
  earnings: TokenAmount;
  date: Date;
}

export interface EarningsUserData {
  earnings: Usdc;
  holdings: Usdc;
  grossApy: number;
  estimatedYearlyYield: Usdc;
  earningsAssetData: EarningsAssetData[];
}

export interface EarningsAssetData {
  assetAddress: Address;
  earned: Usdc;
}
