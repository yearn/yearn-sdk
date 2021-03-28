import { Asset, Token } from "../asset";
import { ChainId } from "../chain";
import { Reader } from "../common";

export class VaultReader<T extends ChainId> extends Reader<T> {
  async getVaults(): Promise<Asset[]> {
    const adapters = Object.values(this.yearn.providers.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.assets();
      })
    ).then(arr => arr.flat());
  }

  async getVaultTokens(): Promise<Token[]> {
    const adapters = Object.values(this.yearn.providers.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.tokens();
      })
    ).then(arr => arr.flat());
  }
}
