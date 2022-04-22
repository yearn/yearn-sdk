import { ChainId, getZapInDetails, VaultDynamic } from ".";
import { createMockAssetDynamicVaultV2, createMockToken } from "./test-utils/factories";

describe("Zap", () => {
  describe("getZapInDetails", () => {
    let assetDynamicVaultV2Mock: VaultDynamic;

    beforeEach(() => {
      assetDynamicVaultV2Mock = createMockAssetDynamicVaultV2();
    });

    it("should return `false` if token does not support zaps", () => {
      const token = createMockToken({ supported: undefined });

      const actual = getZapInDetails({ chainId: 1, token, vault: assetDynamicVaultV2Mock });

      expect(actual).toEqual({ isZapInSupported: false });
    });

    it("should return `false` if vault metadata doesn't have `zapInWith` is not given", () => {
      const token = createMockToken({ supported: { zapperZapIn: true } });
      const vaultWithoutZapInWith = {
        ...assetDynamicVaultV2Mock,
        metadata: { ...assetDynamicVaultV2Mock.metadata, allowZapIn: true, zapInWith: undefined },
      };

      const actual = getZapInDetails({ chainId: 1, token, vault: vaultWithoutZapInWith });

      expect(actual).toEqual({ isZapInSupported: false });
    });

    it("should return `false` when the chain is unsupported", () => {
      const token = createMockToken({ supported: { zapperZapIn: true } });

      const actual = getZapInDetails({ chainId: 42 as ChainId, token, vault: assetDynamicVaultV2Mock });

      expect(actual).toEqual({ isZapInSupported: false });
    });

    describe("when is Ethereum", () => {
      it.each`
        supported                                | zapInWith         | expectation
        ${{ zapper: true, zapperZapIn: true }}   | ${"zapperZapIn"}  | ${{ isZapInSupported: true, zapInWith: "zapperZapIn" }}
        ${{ zapper: false, zapperZapIn: false }} | ${"zapperZapIn"}  | ${{ isZapInSupported: false, zapInWith: "zapperZapIn" }}
        ${{ zapper: true, zapperZapIn: false }}  | ${"zapperZapIn"}  | ${{ isZapInSupported: false, zapInWith: "zapperZapIn" }}
        ${{ zapper: false, zapperZapIn: true }}  | ${"zapperZapIn"}  | ${{ isZapInSupported: false, zapInWith: "zapperZapIn" }}
        ${{ zapper: true, zapperZapIn: true }}   | ${"invalidZapIn"} | ${{ isZapInSupported: false }}
        ${{ zapper: false, zapperZapIn: false }} | ${"invalidZapIn"} | ${{ isZapInSupported: false }}
        ${{ zapper: true, zapperZapIn: false }}  | ${"invalidZapIn"} | ${{ isZapInSupported: false }}
        ${{ zapper: false, zapperZapIn: true }}  | ${"invalidZapIn"} | ${{ isZapInSupported: false }}
      `(
        `should return \`$expectation\` when token supports \`$supported\`, and vaultMetadata has \`$zapInWith\``,
        ({ supported, zapInWith, expectation }) => {
          const token = createMockToken({ supported });
          const vault = {
            ...assetDynamicVaultV2Mock,
            metadata: { ...assetDynamicVaultV2Mock.metadata, zapInWith },
          };

          const actual = getZapInDetails({ chainId: 1, token, vault });

          expect(actual).toEqual(expectation);
        }
      );
    });

    describe("when is Fantom", () => {
      it.each`
        supported               | zapInWith      | expectation
        ${{ ftmApeZap: true }}  | ${"ftmApeZap"} | ${{ isZapInSupported: true, zapInWith: "ftmApeZap" }}
        ${{ ftmApeZap: false }} | ${"ftmApeZap"} | ${{ isZapInSupported: false, zapInWith: "ftmApeZap" }}
      `(
        `should return \`$expectation\` when token supports \`$supported\`, and vaultMetadata has \`$zapInWith\``,
        ({ supported, zapInWith, expectation }) => {
          const token = createMockToken({ supported });
          const vault = {
            ...assetDynamicVaultV2Mock,
            metadata: { ...assetDynamicVaultV2Mock.metadata, zapInWith },
          };

          const actual = getZapInDetails({ chainId: 250, token, vault });

          expect(actual).toEqual(expectation);
        }
      );
    });
  });
});
