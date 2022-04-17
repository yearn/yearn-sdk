import { ChainId, isEthereum, isFantom } from "./chain";
import { Token } from "./types";

export type ZappableType = "zapper" | "ftmApeZap";

type Zappable = { isZappable: boolean; zappableType?: ZappableType };

export function checkZappability({ chainId, token }: { chainId: ChainId; token?: Partial<Token> }): Zappable {
  if (!token) {
    return { isZappable: false };
  }

  if (isEthereum(chainId) && token.supported?.zapper) {
    return { isZappable: true, zappableType: "zapper" };
  }

  if (isFantom(chainId) && token.supported?.ftmApeZap) {
    return { isZappable: true, zappableType: "ftmApeZap" };
  }

  return { isZappable: false };
}
