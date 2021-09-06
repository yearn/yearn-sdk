import { Address, Integer } from "./common";
export interface VaultStrategiesMetadata {
  vaultAddress: Address;
  strategiesMetadata: StrategyMetadata[];
}

export interface StrategyMetadata {
  address: Address;
  debtRatio: Integer;
  name: string;
  description: string;
}
