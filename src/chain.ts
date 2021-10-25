/**
 * Supported chains in the yearn ecosystem.
 */
export const Chains = {
  1: "ethereum",
  250: "fantom",
  1337: "ethereum",
  42161: "arbitrum"
};

export type EthMain = 1;
export type FtmMain = 250;
export type EthLocal = 1337;
export type ArbitrumOne = 42161;

export type ChainId = keyof typeof Chains;
