import { Address, Integer, Usdc } from "../common";

export interface GaugeUserSummary {
  holdings: Usdc;
  earnings: Usdc;
  grossApy: number;
  estimatedYearlyYield: Integer;
}

export interface GaugeUserMetadata {
  assetAddress: Address;
  earned: Usdc;
}
