import { Address, Integer } from "./common";
import { StrategyMetadata } from "./metadata";

export interface VaultStrategiesMetadata {
  vaultAddress: Address;
  metadata: StrategyDetailedMetadata[];
}

export interface StrategyDetailedMetadata extends StrategyMetadata {
  debtRatio: Integer;
}
