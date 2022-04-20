import { ChainId, getZapInDetails } from ".";
import { EthAddress, ZeroAddress } from "./helpers";
import { createMockToken, createMockVaultMetadata } from "./test-utils/factories";

describe("Zap", () => {
  describe("getZapInDetails", () => {
    it("should return `false` if token does not support zaps", () => {
      const token = createMockToken({ supported: undefined });
      const vaultMetadata = createMockVaultMetadata();

      const actual = getZapInDetails({ chainId: 1, token, vaultMetadata });

      expect(actual).toEqual({ isZapInSupported: false });
    });

    it("should return `false` if vaultMetadata is not given", () => {
      const token = createMockToken({ supported: { zapperZapIn: true } });

      const actual = getZapInDetails({ chainId: 1, token, vaultMetadata: null });

      expect(actual).toEqual({ isZapInSupported: false });
    });

    it("should return `false` when the chain is unsupported", () => {
      const token = createMockToken({ supported: { zapperZapIn: true } });
      const vaultMetadata = createMockVaultMetadata({ zapInWith: "zapperZapIn" });

      const actual = getZapInDetails({ chainId: 42 as ChainId, token, vaultMetadata });

      expect(actual).toEqual({ isZapInSupported: false });
    });

    describe("when is Ethereum", () => {
      it('should return `true` and `zapInWith: "zapperZapIn"` when token is ETH', () => {
        const token = createMockToken({ address: EthAddress, supported: { zapper: true } });
        const vaultMetadata = createMockVaultMetadata();

        const actual = getZapInDetails({ chainId: 1, token, vaultMetadata });

        expect(actual).toEqual({ isZapInSupported: true, zapInWith: "zapperZapIn" });
      });

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
          const vaultMetadata = createMockVaultMetadata({ zapInWith });

          const actual = getZapInDetails({ chainId: 1, token, vaultMetadata });

          expect(actual).toEqual(expectation);
        }
      );
    });

    describe("when is Fantom", () => {
      it('should return `true` and `zapInWith: "zapperZapIn"` when token is FTM', () => {
        const token = createMockToken({ address: ZeroAddress, supported: { ftmApeZap: true } });
        const vaultMetadata = createMockVaultMetadata();

        const actual = getZapInDetails({ chainId: 250, token, vaultMetadata });

        expect(actual).toEqual({ isZapInSupported: true, zapInWith: "ftmApeZap" });
      });

      it.each`
        supported               | zapInWith      | expectation
        ${{ ftmApeZap: true }}  | ${"ftmApeZap"} | ${{ isZapInSupported: true, zapInWith: "ftmApeZap" }}
        ${{ ftmApeZap: false }} | ${"ftmApeZap"} | ${{ isZapInSupported: false, zapInWith: "ftmApeZap" }}
      `(
        `should return \`$expectation\` when token supports \`$supported\`, and vaultMetadata has \`$zapInWith\``,
        ({ supported, zapInWith, expectation }) => {
          const token = createMockToken({ supported });
          const vaultMetadata = createMockVaultMetadata({ zapInWith });

          const actual = getZapInDetails({ chainId: 250, token, vaultMetadata });

          expect(actual).toEqual(expectation);
        }
      );
    });
  });
});
