import { AssetHistoricEarnings } from "../..";

export const DEFAULT_ASSET_HISTORIC_EARNINGS: AssetHistoricEarnings = {
  assetAddress: "0x001",
  decimals: 18,
  dayData: [{ earnings: { amount: "1", amountUsdc: "1" }, date: "15-02-2022" }]
};

export const createMockAssetHistoricEarnings = (overwrites: Partial<AssetHistoricEarnings> = {}) => ({
  ...DEFAULT_ASSET_HISTORIC_EARNINGS,
  ...overwrites
});
