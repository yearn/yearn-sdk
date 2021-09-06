import { Address } from "./common";
import { StrategyMetadata } from "./metadata";
export interface VaultStrategiesMetadata {
  vaultAddress: Address;
  strategiesMetadata: StrategyMetadata[];
}
