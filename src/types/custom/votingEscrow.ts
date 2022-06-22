import { Address } from "../common";

type VotingEscrowTransactionType = "LOCK" | "EXTEND";

export interface VotingEscrowUserMetadata {
  assetAddress: Address;
  unlockDate?: Date;
  earlyExitPenaltyRatio?: number;
}
