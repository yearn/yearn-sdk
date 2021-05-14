import { Address, SdkError } from "../types";
import { Position, Vault } from "../types";
import { ChainId } from "../chain";
import { Reader } from "../common";

export class VaultReader<T extends ChainId> extends Reader<T> {
  async get(addresses?: Address[]): Promise<Vault[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        const assetsStatic = await adapter.assetsStatic(addresses);
        const assetsDynamic = await adapter.assetsDynamic(addresses);
        const assetsApy = await this.yearn.services.vision.apy(addresses);
        const assets = new Array<Vault>();
        for (const asset of assetsStatic) {
          const dynamic = assetsDynamic.find(({ address }) => asset.address === address);
          if (!dynamic) {
            throw new SdkError(`Dynamic asset does not exist for ${asset.address}`);
          }
          dynamic.metadata.apy = assetsApy[asset.address];
          assets.push({ ...asset, ...dynamic });
        }
        return assets;
      })
    ).then(arr => arr.flat());
  }

  async positionsOf(address: Address, addresses?: Address[]): Promise<Position[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.positionsOf(address, addresses);
      })
    ).then(arr => arr.flat());
  }
}
