import { Position, IronBankMarket, CyTokenUserMetadata, IronBankPosition } from "../types";
import { ChainId } from "../chain";
import { Address, Reader, SdkError } from "../common";

export class IronBankReader<T extends ChainId> extends Reader<T> {
  async get(addresses?: Address[]): Promise<IronBankMarket[]> {
    const assetsStatic = await this.yearn.services.lens.adapters.ironBank.assetsStatic(addresses);
    const assetsDynamic = await this.yearn.services.lens.adapters.ironBank.assetsDynamic(addresses);
    const assets = new Array<IronBankMarket>();
    for (const asset of assetsStatic) {
      const dynamic = assetsDynamic.find(({ address }) => asset.address === address);
      if (!dynamic) {
        throw new SdkError(`Dynamic asset does not exist for ${asset.address}`);
      }
      assets.push({ ...asset, ...dynamic });
    }
    return assets;
  }

  async positionsOf(address: Address, addresses?: Address[]): Promise<Position[]> {
    return this.yearn.services.lens.adapters.ironBank.positionsOf(address, addresses);
  }

  async userMetadata(address: Address): Promise<CyTokenUserMetadata[]> {
    return this.yearn.services.lens.adapters.ironBank.assetsUserMetadata(address);
  }

  async generalPositionOf(address: Address): Promise<IronBankPosition> {
    return this.yearn.services.lens.adapters.ironBank.generalPositionOf(address);
  }
}
