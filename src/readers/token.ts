import { Address, Integer, Reader } from "../common";
import { ChainId } from "../chain";
import { Token, Balance, BalancesMap, IconMap, Icon } from "../types";

export class TokenReader<C extends ChainId> extends Reader<C> {
  async priceUsdc(token: Address): Promise<Integer> {
    return this.yearn.services.oracle.getPriceUsdc(token);
  }

  async price(from: Address, to: Address): Promise<Integer> {
    return this.yearn.services.oracle.getPriceFromRouter(from, to);
  }

  async balances<T extends Address>(address: T): Promise<Balance[]>;
  async balances<T extends Address>(addresses: T[]): Promise<BalancesMap<T>>;

  async balances<T extends Address>(addresses: T[] | T): Promise<BalancesMap<T> | Balance[]> {
    return this.yearn.services.zapper.balances<T>(addresses);
  }

  async supported(): Promise<Token[]> {
    const tokens = [];
    if (this.chainId === 1 || this.chainId === 1337) {
      // only ETH Main is supported
      const zapper = await this.yearn.services.zapper.supportedTokens();
      tokens.push(...zapper);
    }
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    const vaults = await Promise.all(
      adapters.map(async adapter => {
        const tokenAddresses = await adapter.tokens();
        const tokens = await this.yearn.services.helper.tokens(tokenAddresses);
        const icons = this.yearn.services.icons.get(tokenAddresses);
        return Promise.all(
          tokens.map(async token => ({
            ...token,
            icon: icons[token.address],
            supported: {},
            price: await this.yearn.services.oracle.getPriceUsdc(token.address)
          }))
        );
      })
    ).then(arr => arr.flat());
    tokens.push(...vaults);
    return tokens;
  }

  icon<T extends Address>(address: T): Icon;
  icon<T extends Address>(addresses: T[]): IconMap<T>;
  icon<T extends Address>(address: T | T[]): IconMap<T> | Icon {
    return this.yearn.services.icons.get(address);
  }
}
