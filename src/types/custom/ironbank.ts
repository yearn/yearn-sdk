import { Address, Integer } from "../../common";

export interface IronBankPosition {
  assetAddress: Address;
  enteredMarket: boolean;
  supplyBalanceUsdc: Integer;
  borrowBalanceUsdc: Integer;
  borrowLimitUsdc: Integer;
}

export interface CyTokenUserMetadata {
  supplyBalanceUsdc: Integer;
  borrowBalanceUsdc: Integer;
  borrowLimitUsdc: Integer;
  utilizationRatioBips: Integer;
}
