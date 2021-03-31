import { BigNumber } from "@ethersproject/bignumber";

import { Address, Reader } from "../common";

import { ChainId } from "../chain";
import { Token } from "../assets";
import { Balance, Balances } from "../services/zapper";

export class TokenReader<C extends ChainId> extends Reader<C> {
  async getPriceUsdc(token: Address): Promise<BigNumber> {
    return this.yearn.services.oracle.getPriceUsdcRecommended(token);
  }

  async getPrice(from: Address, to: Address): Promise<BigNumber> {
    return this.yearn.services.oracle.getPriceFromRouter(from, to);
  }

  async balances<T extends Address>(address: T): Promise<Balance[]>;
  async balances<T extends Address>(addresses: T[]): Promise<Balances<T>>;
  async balances<T extends Address>(
    addresses: T[] | T
  ): Promise<Balances<T> | Balance[]>;

  async balances<T extends Address>(
    addresses: T[] | T
  ): Promise<Balances<T> | Balance[]> {
    return this.yearn.services.zapper.balances<T>(addresses);
  }

  async supported(): Promise<Token[]> {
    return this.yearn.services.zapper.supportedTokens();
  }
}
