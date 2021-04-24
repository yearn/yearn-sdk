import { BigNumber } from "@ethersproject/bignumber";

import { Address, Reader } from "../common";
import { ChainId } from "../chain";
import { TokenPriced, Balance, BalancesMap, IconMap, Icon } from "../types";

export class TokenReader<C extends ChainId> extends Reader<C> {
  async priceUsdc(token: Address): Promise<BigNumber> {
    return this.yearn.services.oracle.getPriceUsdcRecommended(token);
  }

  async price(from: Address, to: Address): Promise<BigNumber> {
    return this.yearn.services.oracle.getPriceFromRouter(from, to);
  }

  async icon<T extends Address>(address: T): Promise<Icon>;
  async icon<T extends Address>(addresses: T[]): Promise<IconMap<T>>;
  async icon<T extends Address>(address: T | T[]): Promise<IconMap<T> | Icon> {
    return this.yearn.services.icons.get(address);
  }

  async balances<T extends Address>(address: T): Promise<Balance[]>;
  async balances<T extends Address>(addresses: T[]): Promise<BalancesMap<T>>;

  async balances<T extends Address>(
    addresses: T[] | T
  ): Promise<BalancesMap<T> | Balance[]> {
    return this.yearn.services.zapper.balances<T>(addresses);
  }

  async supported(): Promise<TokenPriced[]> {
    const tokens = [];
    if (this.chainId === 1 || this.chainId === 1337) {
      // only ETH Main is supported
      const zapper = await this.yearn.services.zapper.supportedTokens();
      tokens.push(...zapper);
    }
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    const vaults = await Promise.all(
      adapters.map(async adapter => {
        const tokens = await adapter.tokens();
        return Promise.all(
          tokens.map(async token => ({
            ...token,
            price: await this.yearn.services.oracle.getPriceUsdcRecommended(
              token.id
            )
          }))
        );
      })
    ).then(arr => arr.flat());
    tokens.push(...vaults);
    return tokens;
  }
}
