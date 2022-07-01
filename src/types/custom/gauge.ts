import { Address } from "../common";

export interface GaugeUserMetadata {
  assetAddress: Address;
  boost: number;
  _calculatedBoost: number; // TODO remove after confirm most accurate calc for boost
}
