import { Address, Usdc } from "../common";

export interface EarningsUserData {
  earnings: Usdc;
  holdings: Usdc;
  estimatedYearlyYield: Usdc;
  earningsAssetData: EarningsAssetData[];
}

export interface EarningsAssetData {
  assetAddress: Address;
  earned: Usdc;
}
