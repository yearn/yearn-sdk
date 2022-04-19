import { ChainId, isEthereum, isFantom } from "./chain";
import { Token, VaultMetadataOverrides } from "./types";

type ZapInOptions = { isZapIn: boolean; zapInWith?: keyof Token["supported"] };

type ZapInProps = {
  chainId: ChainId;
  token?: Partial<Token>;
  vaultMetadata: VaultMetadataOverrides | null;
};

export function getZapInOptions({ chainId, token, vaultMetadata }: ZapInProps): ZapInOptions {
  if (!token || !vaultMetadata) {
    return { isZapIn: false };
  }

  if (isEthereum(chainId) && token.supported?.zapperZapIn) {
    const { zapInWith } = vaultMetadata;

    if (zapInWith && isValidZap(zapInWith, token.supported)) {
      return { isZapIn: true, zapInWith };
    }
  }

  if (isFantom(chainId) && token.supported?.ftmApeZap) {
    return { isZapIn: true, zapInWith: "ftmApeZap" };
  }

  return { isZapIn: false };
}

/**
 * Returns true if the given zap is valid for the given token.
 * @param zap the zap type to check
 * @param zappings the zapping types supported by the token
 * @returns true if the zap type is supported by the token
 */
function isValidZap<T>(zap: string | number | symbol, zappings: T): zap is keyof T {
  return zap in zappings;
}
