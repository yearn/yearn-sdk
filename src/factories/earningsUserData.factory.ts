import { EarningsUserData } from "..";
import { createMockEarningsAssetData } from "./earningsAssetData.factory";

export const defaultEarningsUserData: EarningsUserData = {
  earnings: "1",
  holdings: "1",
  grossApy: 1,
  estimatedYearlyYield: "1",
  earningsAssetData: [createMockEarningsAssetData()]
};

export const createMockEarningsUserData = (overwrites: Partial<EarningsUserData> = {}) => ({
  ...defaultEarningsUserData,
  ...overwrites
});
