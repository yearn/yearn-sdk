/**
 * Supported chains in the yearn ecosystem.
 */
export const Chains = {
  1: "ETH Mainnet",
  250: "FTM Mainnet"
};

export type ChainId = keyof typeof Chains;
