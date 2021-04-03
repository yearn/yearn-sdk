import { Apy } from "../services/apy";
import { Asset, Position, Token } from "../assets";
import { ChainId } from "../chain";
import { Address, Reader } from "../common";

export class VaultReader<T extends ChainId> extends Reader<T> {
  async get(): Promise<Asset[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.assets();
      })
    ).then(arr => arr.flat());
  }

  async tokens(): Promise<Token[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.tokens();
      })
    ).then(arr => arr.flat());
  }

  async positionsOf(address: Address): Promise<Position[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.positionsOf(address);
      })
    ).then(arr => arr.flat());
  }

  async apy(address: Address): Promise<Apy | undefined> {
    return this.yearn.services.apy.get(address);
  }
}
