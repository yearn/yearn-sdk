import { Apy } from "../..";

export const DEFAULT_APY: Apy = {
  type: "apyType",
  grossApr: 2,
  netApy: 3,
  fees: {
    performance: null,
    withdrawal: null,
    management: null,
    keepCrv: null,
    cvxKeepCrv: null,
  },
  points: null,
  composite: null,
};

export const createMockApy = (overwrites: Partial<Apy> = {}): Apy => ({
  ...DEFAULT_APY,
  ...overwrites,
});
