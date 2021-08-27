import { Address, Integer } from "./common";
import { StrategyMetadata } from "./metadata";

export interface VaultStrategiesMetadata {
  vaultAddress: Address;
  strategiesMetadata: StrategyDetailedMetadata[];
}

export interface StrategyDetailedMetadata extends StrategyMetadata {
  address: Address;
  debtRatio: Integer;
}
