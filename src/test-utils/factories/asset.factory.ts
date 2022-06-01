import { Asset, AssetDynamic } from "../..";

const DEFAULT_ASSET_STATIC_VAULT_V2: Asset<"VAULT_V2"> = {
  address: "0x001",
  typeId: "VAULT_V2",
  token: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  name: "WETH yVault",
  version: "0.4.2",
  symbol: "yvWETH",
  decimals: "18",
  tokenId: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  underlyingTokenBalance: {
    amount: "97264105400273928294651",
    amountUsdc: "291590006861589",
  },
  metadata: {
    controller: "0x0000000000000000000000000000000000000000",
    totalAssets: "0",
    totalSupply: "0",
    pricePerShare: "1012461338932045908",
    migrationAvailable: false,
    latestVaultAddress: "0xa258C4606Ca8206D8aA700cE2143D7db854D168c",
    depositLimit: "300000000000000000000000",
    emergencyShutdown: false,
    apy: {
      type: "v2:averaged",
      grossApr: 0.037095359870555886,
      netApy: 0.013768413207033037,
      fees: {
        performance: 0.2,
        withdrawal: null,
        management: 0.02,
        keepCrv: null,
        cvxKeepCrv: null,
      },
      points: {
        weekAgo: 0.014269342961674925,
        monthAgo: 0.013768413207033037,
        inception: 0.014187692917827954,
      },
      composite: null,
    },
    displayIcon:
      "https://raw.githack.com/yearn/yearn-assets/master/icons/multichain-tokens/1/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE/logo-128.png",
    displayName: "ETH",
    defaultDisplayToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    depositsDisabled: false,
    withdrawalsDisabled: false,
    allowZapIn: true,
    allowZapOut: true,
    zapInWith: "zapperZapIn",
    zapOutWith: "zapperZapOut",
    hideIfNoDeposits: false,
    strategies: {
      vaultAddress: "0xa258C4606Ca8206D8aA700cE2143D7db854D168c",
      strategiesMetadata: [
        {
          address: "0xF9fDc2B5F60355A237deb8BD62CC117b1C907f7b",
          name: "Curve Yield Seeker",
          description:
            "Supplies WETH to [Curve Finance](https://curve.fi) to earn CRV. Earned tokens are harvested, sold for more WETH which is deposited back into the strategy. Strategy automatically switches to the most profitable Curve pool.",
          protocols: ["CurveFinance"],
        },
        {
          address: "0x0967aFe627C732d152e3dFCAdd6f9DBfecDE18c3",
          name: "Lido Eth 2.0 Staking",
          description:
            "Stakes WETH on [Lido.fi](https://stake.lido.fi) to mint stETH which accumulates ETH 2.0 staking rewards. This strategy will buy stETH off the market if it is cheaper than staking.",
          protocols: ["LidoFinance"],
        },
        {
          address: "0x1d4439680c489f18ce480e72DeeDc235952AF9C9",
          name: "Single Sided Balancer",
          description:
            "Supplies WETH to a Stable Pool on [Balancer](https://app.balancer.fi) to earn BAL and trading fees. Rewards are harvested, sold for more WETH, and deposited back into the strategy.",
          protocols: ["Balancer"],
        },
        {
          address: "0x2EFB43C8C9AFe71d98B3093C3FD4dEB7Ce543C6D",
          name: "Tokemak Reinvest",
          description:
            "Supplies WETH to [Tokemak](https://www.tokemak.xyz) to earn TOKE. Earned tokens are harvested, sold for more WETH which is deposited back into the strategy.",
          protocols: ["Tokemak"],
        },
      ],
    },
  },
};

const DEFAULT_ASSET_DYNAMIC_VAULT_V2: AssetDynamic<"VAULT_V2"> = {
  address: "0x001",
  typeId: "VAULT_V2",
  tokenId: "0x001Dynamic",
  underlyingTokenBalance: {
    amount: "1",
    amountUsdc: "1",
  },
  metadata: {
    symbol: "str",
    pricePerShare: "Int",
    migrationAvailable: true,
    latestVaultAddress: "0x001",
    depositLimit: "Int",
    emergencyShutdown: true,

    controller: "0x001",
    totalAssets: "Int",
    totalSupply: "Int",

    displayName: "str",
    displayIcon: "str",
    defaultDisplayToken: "0x001",

    hideIfNoDeposits: true,
  },
};

export const createMockAssetStaticVaultV2 = (overwrites: Partial<Asset<"VAULT_V2">> = {}): Asset<"VAULT_V2"> => ({
  ...DEFAULT_ASSET_STATIC_VAULT_V2,
  ...overwrites,
});

export const createMockAssetDynamicVaultV2 = (
  overwrites: Partial<AssetDynamic<"VAULT_V2">> = {}
): AssetDynamic<"VAULT_V2"> => ({
  ...DEFAULT_ASSET_DYNAMIC_VAULT_V2,
  ...overwrites,
});
