import { Address, Integer } from "../common";

/**
 * Generalized position of an address in the IronBank.
 */
export interface CyTokenUserMetadata {
  assetAddress: Address;
  enteredMarket: boolean;
  supplyBalanceUsdc: Integer;
  borrowBalanceUsdc: Integer;
  collateralBalanceUsdc: Integer;
  borrowLimitUsdc: Integer;
}

export interface IronBankUserSummary {
  supplyBalanceUsdc: Integer;
  borrowBalanceUsdc: Integer;
  borrowLimitUsdc: Integer;
  utilizationRatioBips: Integer;
}
