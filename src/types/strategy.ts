import { Address, Integer } from "./common";
import { StrategyMetadata } from "./metadata";

export interface VaultStrategyData {
  address: Address;
  data: StrategyData[];
}

export interface StrategyData extends StrategyMetadata {
  debtRatio: Integer;
}
