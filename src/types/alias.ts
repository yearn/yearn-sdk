import { Asset, AssetDynamic, AssetStatic } from "./asset";

export type VaultV1 = Asset<"v1Vault">;
export type VaultV2 = Asset<"v2Vault">;
export type VaultV1Static = AssetStatic<"v1Vault">;
export type VaultV2Static = AssetStatic<"v2Vault">;
export type VaultV1Dynamic = AssetDynamic<"v1Vault">;
export type VaultV2Dynamic = AssetDynamic<"v2Vault">;

export type Vault = VaultV1 | VaultV2;
export type VaultStatic = VaultV1Static | VaultV2Static;
export type VaultDynamic = VaultV1Dynamic | VaultV2Dynamic;
