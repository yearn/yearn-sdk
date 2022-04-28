import { DepositableVault } from "../..";

const DEFAULT_DEPOSITABLE_VAULT: DepositableVault = {
  address: "0x001",
  token: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  decimals: "18",
  metadata: {
    pricePerShare: "1012461338932045908",
    allowZapIn: true,
    allowZapOut: true,
    zapInWith: "zapperZapIn",
    zapOutWith: "zapperZapOut",
  },
};

export const createMockDepositableVault = (overwrites: Partial<DepositableVault> = {}): DepositableVault => ({
  ...DEFAULT_DEPOSITABLE_VAULT,
  ...overwrites,
});
