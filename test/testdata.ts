import { Vault } from "../src/vault/interfaces";

export const vaults = {
  v1: {
    address: "0x29E240CFD7946BA20895a7a02eDb25C210f9f324",
    object: {
      address: "0x29E240CFD7946BA20895a7a02eDb25C210f9f324",
      name: "yearn Aave Interest bearing LINK",
      symbol: "yaLINK",
      decimals: 18,
      token: {
        name: "Aave Interest bearing LINK",
        symbol: "aLINK",
        address: "0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84",
        decimals: 18
      },
      type: "v1"
    } as Vault,
    inception: 10599650
  },
  v2: {
    address: "0x33bd0f9618cf38fea8f7f01e1514ab63b9bde64b",
    object: {
      address: "0x33bd0f9618cf38fea8f7f01e1514ab63b9bde64b",
      name: "yearn USD Coin IdleStrategies Test",
      symbol: "yUSDCIdleTest",
      emergencyShutdown: false,
      decimals: 6,
      token: {
        name: "USD Coin",
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6
      },
      type: "v2"
    } as Vault,
    inception: 11421934
  }
};
