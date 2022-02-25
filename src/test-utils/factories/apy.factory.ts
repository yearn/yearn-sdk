import { Apy } from "../..";

export const DEFAULT_APY: Apy = {
  type: "apyType",
  gross_apr: 2,
  net_apy: 3,
  fees: {
    performance: null,
    withdrawal: null,
    management: null,
    keep_crv: null,
    cvx_keep_crv: null
  },
  points: null,
  composite: null
};

export const createMockApy = (overwrites: Partial<Apy> = {}) => ({
  ...DEFAULT_APY,
  ...overwrites
});
