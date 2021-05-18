import { Address, Integer, TypedMap, Usdc } from "../types";
import { Reader } from "../common";
import { ChainId } from "../chain";
import { Token, Balance, IconMap, Icon } from "../types";
import { CallOverrides } from "@ethersproject/contracts";

export class TokenReader<C extends ChainId> extends Reader<C> {
  async price(from: Address, to: Address): Promise<Integer> {
    return this.yearn.services.oracle.getPriceFromRouter(from, to);
  }

  async priceUsdc<T extends Address>(token: T, overrides?: CallOverrides): Promise<Usdc>;
  async priceUsdc<T extends Address>(tokens: T[], overrides?: CallOverrides): Promise<TypedMap<T, Usdc>>;
  async priceUsdc<T extends Address>(tokens: T | T[], overrides?: CallOverrides): Promise<TypedMap<T, Usdc> | Usdc> {
    if (Array.isArray(tokens)) {
      const entries = await Promise.all(
        tokens.map(async token => {
          const price = await this.yearn.services.oracle.getPriceUsdc(token, overrides);
          return [token, price];
        })
      );
      return Object.fromEntries(entries) as TypedMap<T, Usdc>;
    }
    return this.yearn.services.oracle.getPriceUsdc(tokens, overrides);
  }

  async balances(address: Address): Promise<Balance[]> {
    return this.yearn.services.zapper.balances(address);
  }

  async supported(): Promise<Token[]> {
    if (this.chainId === 1 || this.chainId === 1337) {
      // only ETH Main is supported
      return await this.yearn.services.zapper.supportedTokens();
    }
    return [];
  }

  icon<T extends Address>(address: T): Icon;
  icon<T extends Address>(addresses: T[]): IconMap<T>;
  icon<T extends Address>(address: T | T[]): IconMap<T> | Icon {
    return this.yearn.services.icons.get(address);
  }
}
