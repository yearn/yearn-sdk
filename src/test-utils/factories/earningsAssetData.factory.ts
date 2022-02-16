import { EarningsAssetData } from "../..";

const DEFAULT_EARNINGS_ASSET_DATA: EarningsAssetData = {
  assetAddress: "0x001",
  earned: "1"
};

export const createMockEarningsAssetData = (overwrites: Partial<EarningsAssetData> = {}) => ({
  ...DEFAULT_EARNINGS_ASSET_DATA,
  ...overwrites
});
