import { Asset, Position, Token } from "../asset";
import { ChainId } from "../chain";
import { Address, Reader } from "../common";

export class VaultReader<T extends ChainId> extends Reader<T> {
  async get(): Promise<Asset[]> {
    const adapters = Object.values(this.yearn.providers.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.assets();
      })
    ).then(arr => arr.flat());
  }

  async getTokens(): Promise<Token[]> {
    const adapters = Object.values(this.yearn.providers.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.tokens();
      })
    ).then(arr => arr.flat());
  }

  async getPositionsOf(address: Address): Promise<Position[]> {
    const adapters = Object.values(this.yearn.providers.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.positionsOf(address);
      })
    ).then(arr => arr.flat());
  }
}
