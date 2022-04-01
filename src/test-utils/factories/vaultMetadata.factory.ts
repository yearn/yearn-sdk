import { VaultMetadataOverrides } from "../../types";

const DEFAULT_VAULT_METADATA: VaultMetadataOverrides = {
  comment: "Vault Metadata Comment",
  hideAlways: false,
  depositsDisabled: false,
  withdrawalsDisabled: false,
  order: 19,
  migrationAvailable: false,
  allowZapIn: true,
  allowZapOut: true,
  retired: false,
  displayName: "Vault Metadata",
  address: "0x001"
};

export const createMockVaultMetadata = (overwrites: Partial<VaultMetadataOverrides> = {}): VaultMetadataOverrides => ({
  ...DEFAULT_VAULT_METADATA,
  ...overwrites
});
