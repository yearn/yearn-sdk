import { Asset } from "../..";

export const DEFAULT_ASSET_STATIC_VAULT_V2: Asset<"VAULT_V2"> = {
  address: "0x001",
  typeId: "VAULT_V2",
  token: "0x001",
  name: "ASSET",
  version: "1",
  symbol: "ASS",
  decimals: "18",
  tokenId: "0x001",
  underlyingTokenBalance: {
    amount: "1",
    amountUsdc: "1"
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

    hideIfNoDeposits: true
  }
};

export const createMockAssetStaticVaultV2 = (overwrites: Partial<Asset<"VAULT_V2">> = {}) => ({
  ...DEFAULT_ASSET_STATIC_VAULT_V2,
  ...overwrites
});
