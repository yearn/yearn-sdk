import { Address } from "./types";

/**
 * Supported chains in the yearn ecosystem.
 */
export const Chains = {
  1: "ethereum",
  5: "goerli",
  10: "optimism",
  250: "fantom",
  1337: "ethereum",
  42161: "arbitrum",
};

export type Network = "ethereum" | "optimism" | "fantom" | "arbitrum" | "goerli;

export type ChainId = keyof typeof Chains;

export const isEthereum = (chainId: ChainId): boolean => {
  return chainId === 1 || chainId === 1337;
};

export const isGoerli = (chainId: ChainId): boolean => {
  return chainId === 5;
};

export const isOptimism = (chainId: ChainId): boolean => {
  return chainId === 10;
};

export const isFantom = (chainId: ChainId): boolean => {
  return chainId === 250;
};

export const isArbitrum = (chainId: ChainId): boolean => {
  return chainId === 42161;
};

export const allSupportedChains = Object.keys(Chains).map((key) => Number(key));

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const NATIVE_TOKEN_ADDRESS = ZERO_ADDRESS;

export interface NetworkSettings {
  [chainId: number]: {
    id: Network;
    name: string;
    chainId: number;
    rpcUrl: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
      address: string;
    };
    wrappedTokenAddress?: Address;
    simulationsEnabled?: boolean;
    zapsEnabled?: boolean;
    zapOutTokenSymbols?: string[];
    blockExplorerUrl?: string;
  };
}

export const NETWORK_SETTINGS: NetworkSettings = {
  1: {
    id: "ethereum",
    name: "Ethereum",
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: ETH_ADDRESS,
    },
    wrappedTokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    simulationsEnabled: true,
    zapsEnabled: true,
    zapOutTokenSymbols: ["ETH", "DAI", "USDC", "USDT", "WBTC"],
    blockExplorerUrl: "https://etherscan.io",
  },
  10: {
    id: "optimism",
    name: "Optimism",
    chainId: 10,
    rpcUrl: "https://mainnet.optimism.io",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: NATIVE_TOKEN_ADDRESS,
    },
    simulationsEnabled: false,
    zapsEnabled: false,
    blockExplorerUrl: "https://optimistic.etherscan.io",
  },
  250: {
    id: "fantom",
    name: "Fantom",
    chainId: 250,
    rpcUrl: "https://rpc.ftm.tools",
    nativeCurrency: {
      name: "Fantom",
      symbol: "FTM",
      decimals: 18,
      address: NATIVE_TOKEN_ADDRESS,
    },
    wrappedTokenAddress: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
    simulationsEnabled: true,
    zapsEnabled: true,
    zapOutTokenSymbols: ["FTM", "DAI", "USDC", "USDT"],
    blockExplorerUrl: "https://ftmscan.com",
  },
  1337: {
    id: "ethereum",
    name: "Ethereum",
    chainId: 1337,
    rpcUrl: "http://localhost:8545",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: ETH_ADDRESS,
    },
    wrappedTokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    simulationsEnabled: false,
    zapsEnabled: true,
    zapOutTokenSymbols: ["ETH", "DAI", "USDC", "USDT", "WBTC"],
  },
  42161: {
    id: "arbitrum",
    name: "Arbitrum",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: NATIVE_TOKEN_ADDRESS,
    },
    simulationsEnabled: false,
    zapsEnabled: false,
    blockExplorerUrl: "https://arbiscan.io",
  },
};
