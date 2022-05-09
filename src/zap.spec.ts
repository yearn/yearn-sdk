import { ChainId, getZapInDetails, getZapOutDetails, ZappableVault } from ".";
import { createMockToken, createMockZappableVault } from "./test-utils/factories";

describe("Zap", () => {
  describe("getZapInDetails", () => {
    let depositableVault: ZappableVault;

    beforeEach(() => {
      depositableVault = createMockZappableVault();
    });

    it("should return `false` if token does not support zaps", () => {
      const token = createMockToken({ supported: undefined });

      const actual = getZapInDetails({ chainId: 1, token, vault: depositableVault });

      expect(actual).toEqual({ isZapInSupported: false, zapInWith: null });
    });

    it("should return `false` if vault metadata doesn't have `zapInWith` is not given", () => {
      const token = createMockToken({ supported: { zapperZapIn: true } });
      const vaultWithoutZapInWith = {
        ...depositableVault,
        metadata: { ...depositableVault.metadata, allowZapIn: true, zapInWith: undefined },
      };

      const actual = getZapInDetails({ chainId: 1, token, vault: vaultWithoutZapInWith });

      expect(actual).toEqual({ isZapInSupported: false, zapInWith: null });
    });

    it("should return `false` when the chain is unsupported", () => {
      const token = createMockToken({ supported: { zapperZapIn: true } });

      const actual = getZapInDetails({ chainId: 42 as ChainId, token, vault: depositableVault });

      expect(actual).toEqual({ isZapInSupported: false, zapInWith: null });
    });

    describe("when is Ethereum", () => {
      it.each`
        supported                                | zapInWith         | expectation
        ${{ zapper: true, zapperZapIn: true }}   | ${"zapperZapIn"}  | ${{ isZapInSupported: true, zapInWith: "zapperZapIn" }}
        ${{ zapper: false, zapperZapIn: false }} | ${"zapperZapIn"}  | ${{ isZapInSupported: false, zapInWith: null }}
        ${{ zapper: true, zapperZapIn: false }}  | ${"zapperZapIn"}  | ${{ isZapInSupported: false, zapInWith: null }}
        ${{ zapper: false, zapperZapIn: true }}  | ${"zapperZapIn"}  | ${{ isZapInSupported: false, zapInWith: null }}
        ${{ zapper: true, zapperZapIn: true }}   | ${"invalidZapIn"} | ${{ isZapInSupported: false, zapInWith: null }}
        ${{ zapper: false, zapperZapIn: false }} | ${"invalidZapIn"} | ${{ isZapInSupported: false, zapInWith: null }}
        ${{ zapper: true, zapperZapIn: false }}  | ${"invalidZapIn"} | ${{ isZapInSupported: false, zapInWith: null }}
        ${{ zapper: false, zapperZapIn: true }}  | ${"invalidZapIn"} | ${{ isZapInSupported: false, zapInWith: null }}
      `(
        `should return \`$expectation\` when token supports \`$supported\`, and vaultMetadata has \`$zapInWith\``,
        ({ supported, zapInWith, expectation }) => {
          const token = createMockToken({ supported });
          const vault = {
            ...depositableVault,
            metadata: { ...depositableVault.metadata, zapInWith },
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
        ${{ ftmApeZap: false }} | ${"ftmApeZap"} | ${{ isZapInSupported: false, zapInWith: null }}
      `(
        `should return \`$expectation\` when token supports \`$supported\`, and vaultMetadata has \`$zapInWith\``,
        ({ supported, zapInWith, expectation }) => {
          const token = createMockToken({ supported });
          const vault = {
            ...depositableVault,
            metadata: { ...depositableVault.metadata, zapInWith },
          };

          const actual = getZapInDetails({ chainId: 250, token, vault });

          expect(actual).toEqual(expectation);
        }
      );
    });
  });

  describe("getZapOutDetails", () => {
    let withdrawableVault: ZappableVault;

    beforeEach(() => {
      withdrawableVault = createMockZappableVault();
    });

    it("should return `false` if token does not support zaps", () => {
      const token = createMockToken({ supported: undefined });

      const actual = getZapOutDetails({ chainId: 1, token, vault: withdrawableVault });

      expect(actual).toEqual({ isZapOutSupported: false, zapOutWith: null });
    });

    it("should return `false` if vault metadata doesn't have `zapOutWith` is not given", () => {
      const token = createMockToken({ supported: { zapperZapOut: true } });
      const vaultWithoutZapOutWith = {
        ...withdrawableVault,
        metadata: { ...withdrawableVault.metadata, allowZapOut: true, zapOutWith: undefined },
      };

      const actual = getZapOutDetails({ chainId: 1, token, vault: vaultWithoutZapOutWith });

      expect(actual).toEqual({ isZapOutSupported: false, zapOutWith: null });
    });

    it("should return `false` when the chain is unsupported", () => {
      const token = createMockToken({ supported: { zapperZapOut: true } });

      const actual = getZapOutDetails({ chainId: 42 as ChainId, token, vault: withdrawableVault });

      expect(actual).toEqual({ isZapOutSupported: false, zapOutWith: null });
    });

    describe("when is Ethereum", () => {
      it.each`
        supported                                 | zapOutWith         | expectation
        ${{ zapper: true, zapperZapOut: true }}   | ${"zapperZapOut"}  | ${{ isZapOutSupported: true, zapOutWith: "zapperZapOut" }}
        ${{ zapper: false, zapperZapOut: false }} | ${"zapperZapOut"}  | ${{ isZapOutSupported: false, zapOutWith: null }}
        ${{ zapper: true, zapperZapOut: false }}  | ${"zapperZapOut"}  | ${{ isZapOutSupported: false, zapOutWith: null }}
        ${{ zapper: false, zapperZapOut: true }}  | ${"zapperZapOut"}  | ${{ isZapOutSupported: false, zapOutWith: null }}
        ${{ zapper: true, zapperZapOut: true }}   | ${"invalidZapOut"} | ${{ isZapOutSupported: false, zapOutWith: null }}
        ${{ zapper: false, zapperZapOut: false }} | ${"invalidZapOut"} | ${{ isZapOutSupported: false, zapOutWith: null }}
        ${{ zapper: true, zapperZapOut: false }}  | ${"invalidZapOut"} | ${{ isZapOutSupported: false, zapOutWith: null }}
        ${{ zapper: false, zapperZapOut: true }}  | ${"invalidZapOut"} | ${{ isZapOutSupported: false, zapOutWith: null }}
      `(
        `should return \`$expectation\` when token supports \`$supported\`, and vaultMetadata has \`$zapOutWith\``,
        ({ supported, zapOutWith, expectation }) => {
          const token = createMockToken({ supported });
          const vault = {
            ...withdrawableVault,
            metadata: { ...withdrawableVault.metadata, zapOutWith },
          };

          const actual = getZapOutDetails({ chainId: 1, token, vault });

          expect(actual).toEqual(expectation);
        }
      );
    });

    describe("when is Fantom", () => {
      it.each`
        supported               | zapOutWith     | expectation
        ${{ ftmApeZap: true }}  | ${"ftmApeZap"} | ${{ isZapOutSupported: true, zapOutWith: "ftmApeZap" }}
        ${{ ftmApeZap: false }} | ${"ftmApeZap"} | ${{ isZapOutSupported: false, zapOutWith: null }}
      `(
        `should return \`$expectation\` when token supports \`$supported\`, and vaultMetadata has \`$zapOutWith\``,
        ({ supported, zapOutWith, expectation }) => {
          const token = createMockToken({ supported });
          const vault = {
            ...withdrawableVault,
            metadata: { ...withdrawableVault.metadata, zapOutWith },
          };

          const actual = getZapOutDetails({ chainId: 250, token, vault });

          expect(actual).toEqual(expectation);
        }
      );
    });
  });
});
