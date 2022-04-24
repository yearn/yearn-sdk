import { ChainId, isEthereum, isFantom } from "./chain";
import { Token, VaultDynamic } from "./types";

export type ZapInWith = keyof Token["supported"];

type ZapInDetails = { isZapInSupported: boolean; zapInWith: ZapInWith | null };

type ZapInArgs = {
  chainId: ChainId;
  token?: Partial<Token>;
  vault?: VaultDynamic;
};

export function getZapInDetails({ chainId, token, vault }: ZapInArgs): ZapInDetails {
  if (!token?.supported || !vault?.metadata?.zapInWith) {
    return { isZapInSupported: false, zapInWith: null };
  }

  if (isEthereum(chainId)) {
    const { zapInWith } = vault.metadata;

    if (zapInWith && isValidZap(zapInWith, token.supported)) {
      const isZapInSupported = Boolean(token.supported.zapper) && Boolean(token.supported[zapInWith]);
      return { isZapInSupported, zapInWith: isZapInSupported ? zapInWith : null };
    }
  }

  if (isFantom(chainId)) {
    const zapInWith = "ftmApeZap"; // Hardcoded for now

    const isZapInSupported = Boolean(token.supported[zapInWith]);
    return { isZapInSupported, zapInWith: isZapInSupported ? zapInWith : null };
  }

  return { isZapInSupported: false, zapInWith: null };
}

/**
 * Returns true if the given zap is valid for the given token.
 * @param zap the zap type to check
 * @param zaps the zap types supported by the token
 * @returns true if the zap type is supported by the token
 */
function isValidZap<T>(zap: string | number | symbol, zaps: T): zap is keyof T {
  return zap in zaps;
}
