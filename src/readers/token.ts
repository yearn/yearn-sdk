import { BigNumber } from "@ethersproject/bignumber";

import { Balance, BalancesMap } from "../services/zapper";
import { Address, Reader } from "../common";
import { ChainId } from "../chain";
import { Token } from "../types";

export class TokenReader<C extends ChainId> extends Reader<C> {
  async priceUsdc(token: Address): Promise<BigNumber> {
    return this.yearn.services.oracle.getPriceUsdcRecommended(token);
  }

  async price(from: Address, to: Address): Promise<BigNumber> {
    return this.yearn.services.oracle.getPriceFromRouter(from, to);
  }

  async balances<T extends Address>(address: T): Promise<Balance[]>;
  async balances<T extends Address>(addresses: T[]): Promise<BalancesMap<T>>;
  async balances<T extends Address>(
    addresses: T[] | T
  ): Promise<BalancesMap<T> | Balance[]>;

  async balances<T extends Address>(
    addresses: T[] | T
  ): Promise<BalancesMap<T> | Balance[]> {
    return this.yearn.services.zapper.balances<T>(addresses);
  }

  async supported(): Promise<Token[]> {
    return this.yearn.services.zapper.supportedTokens();
  }
}
