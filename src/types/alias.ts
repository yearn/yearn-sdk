import { Asset, AssetDynamic, AssetStatic } from "./asset";

export type VaultV1 = Asset<"VAULT_V1">;
export type VaultV2 = Asset<"VAULT_V2">;
export type VaultV1Static = AssetStatic<"VAULT_V1">;
export type VaultV2Static = AssetStatic<"VAULT_V2">;
export type VaultV1Dynamic = AssetDynamic<"VAULT_V1">;
export type VaultV2Dynamic = AssetDynamic<"VAULT_V2">;

export type Vault = VaultV1 | VaultV2;
export type VaultStatic = VaultV1Static | VaultV2Static;
export type VaultDynamic = VaultV1Dynamic | VaultV2Dynamic;
