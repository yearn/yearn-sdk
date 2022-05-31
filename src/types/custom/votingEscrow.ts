import { Integer, Usdc } from "../common";

export interface VotingEscrowUserSummary {
  holdings: Usdc;
  earnings: Usdc;
  grossApy: number;
  estimatedYearlyYield: Integer;
}
