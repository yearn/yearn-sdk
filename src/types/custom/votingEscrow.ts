import { Address, Milliseconds } from "../common";

export type VotingEscrowTransactionType = "LOCK" | "EXTEND";

export interface VotingEscrowUserMetadata {
  assetAddress: Address;
  unlockDate?: Milliseconds;
  earlyExitPenaltyRatio?: number;
}
