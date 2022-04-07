import { createMockTokenMarketData, createMockVaultMetadata } from "../../test-utils/factories";
import { mergeZapperPropsWithAddressables } from "./mergeZapperPropsWithAddressables";

describe("mergeZapperProps", () => {
  it("should set the zapper properties on a vault's metadata", async () => {
    const vaultMetadataMock = {
      zappable: createMockVaultMetadata({
        displayName: "Zappable",
        address: "0x16de59092dae5ccf4a1e6439d611fd0653f0bd01", // not checksummed
      }),
      notZappable: createMockVaultMetadata({
        displayName: "Not Zappable",
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      }),
    };

    const vaultTokenMarketDataMock = {
      zappable: createMockTokenMarketData({
        label: "Zappable",
        address: "0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01", // checksummed
      }),
      notInVaults: createMockTokenMarketData({
        label: "Not in Vaults",
        address: "0xd6aD7a6750A7593E092a9B218d66C0A814a3436e",
      }),
      random: createMockTokenMarketData({ label: "Random", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }),
    };

    const actual = mergeZapperPropsWithAddressables(
      [vaultMetadataMock.zappable, vaultMetadataMock.notZappable],
      [
        vaultTokenMarketDataMock.zappable.address,
        vaultTokenMarketDataMock.notInVaults.address,
        vaultTokenMarketDataMock.random.address,
      ]
    );

    expect(actual.length).toEqual(2);
    expect(actual).toEqual(
      expect.arrayContaining([
        {
          ...vaultMetadataMock.zappable,
          allowZapIn: true,
          allowZapOut: true,
          zapInWith: "zapperZapIn",
          zapOutWith: "zapperZapOut",
        },
        {
          ...vaultMetadataMock.notZappable,
          allowZapIn: false,
          allowZapOut: false,
          zapInWith: undefined,
          zapOutWith: undefined,
        },
      ])
    );
  });
});
