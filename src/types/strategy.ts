import { Integer } from "./common";
import { StrategyMetadata } from "./metadata";

export interface StrategyData extends StrategyMetadata {
  debtRatio: Integer;
}
