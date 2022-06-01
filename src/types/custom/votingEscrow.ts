import { Address, Integer, Usdc } from "../common";

export interface VotingEscrowUserSummary {
  holdings: Usdc;
  earnings: Usdc;
  grossApy: number;
  estimatedYearlyYield: Integer;
}

export interface VotingEscrowUserMetadata {
  assetAddress: Address;
  earned: Usdc;
}
