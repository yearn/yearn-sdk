import { Address } from "../common";

export interface VotingEscrowUserMetadata {
  assetAddress: Address;
  unlockDate?: Date;
  earlyExitPenaltyRatio?: number;
}
