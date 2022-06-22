import { Address } from "../common";

export type VotingEscrowTransactionType = "LOCK" | "EXTEND";

export interface VotingEscrowUserMetadata {
  assetAddress: Address;
  unlockDate?: Date;
  earlyExitPenaltyRatio?: number;
}
