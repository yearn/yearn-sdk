import { BigNumber } from "@ethersproject/bignumber";

import { Address, Reader } from "../common";

import { ChainId } from "../chain";

export class TokenReader<T extends ChainId> extends Reader<T> {
  async getPriceUsdc(token: Address): Promise<BigNumber> {
    return this.yearn.providers.oracle.getPriceUsdcRecommended(token);
  }

  async getPrice(from: Address, to: Address): Promise<BigNumber> {
    return this.yearn.providers.oracle.getPriceFromRouter(from, to);
  }
}
