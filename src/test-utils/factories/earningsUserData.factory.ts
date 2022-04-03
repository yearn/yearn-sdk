import { EarningsUserData } from "../..";
import { createMockEarningsAssetData } from "./earningsAssetData.factory";

const DEFAULT_EARNINGS_USER_DATA: EarningsUserData = {
  earnings: "1",
  holdings: "1",
  grossApy: 1,
  estimatedYearlyYield: "1",
  earningsAssetData: [createMockEarningsAssetData()],
};

export const createMockEarningsUserData = (overwrites: Partial<EarningsUserData> = {}): EarningsUserData => ({
  ...DEFAULT_EARNINGS_USER_DATA,
  ...overwrites,
});
