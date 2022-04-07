import { VaultTokenMarketData } from "../../types";

const DEFAULT_TOKEN_MARKET_DATA: VaultTokenMarketData = {
  type: "vault",
  category: "deposit",
  network: "ethereum",
  address: "0x16de59092dae5ccf4a1e6439d611fd0653f0bd01",
  symbol: "yDAI",
  label: "yDAI",
  img: "https://storage.googleapis.com/zapper-fi-assets/apps/yearn.png",
  decimals: 18,
  price: 1.126570223844831,
  pricePerShare: 1.126570223844831,
  liquidity: 6899652.482441678,
  supply: 6124476.163495696,
  appId: "yearn",
  isBlocked: true,
  tokens: [
    {
      type: "base",
      network: "ethereum",
      address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      decimals: 18,
      symbol: "DAI",
      price: 1,
      reserve: 6899652.482441678,
      tokenImageUrl:
        "https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x6b175474e89094c44da98b954eedeac495271d0f.png",
    },
  ],
  appName: "Yearn",
  appImageUrl: "https://storage.googleapis.com/zapper-fi-assets/apps/yearn.png",
  protcolDisplay: "Yearn",
};

export const createMockTokenMarketData = (overwrites: Partial<VaultTokenMarketData> = {}): VaultTokenMarketData => ({
  ...DEFAULT_TOKEN_MARKET_DATA,
  ...overwrites,
});
