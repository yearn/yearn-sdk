import { EarningsAssetData } from "..";

export const defaultEarningsAssetData: EarningsAssetData = {
  assetAddress: "0x001",
  earned: "1"
};

export const createMockEarningsAssetData = (overwrites: Partial<EarningsAssetData> = {}) => ({
  ...defaultEarningsAssetData,
  ...overwrites
});
