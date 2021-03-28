/**
 * Supported chains in the yearn ecosystem.
 */
export const Chains = {
  1: "ETH Mainnet",
  250: "FTM Mainnet"
};

export type EthMain = 1;
export type FtmMain = 250;

export type ChainId = keyof typeof Chains;
