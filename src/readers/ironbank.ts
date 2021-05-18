import {
  Position,
  IronBankMarket,
  CyTokenUserMetadata,
  IronBankPosition,
  Address,
  SdkError,
  IronBankMarketStatic,
  IronBankMarketDynamic
} from "../types";
import { ChainId } from "../chain";
import { Reader } from "../common";
import { CallOverrides } from "@ethersproject/contracts";

export class IronBankReader<T extends ChainId> extends Reader<T> {
  async get(addresses?: Address[], overrides?: CallOverrides): Promise<IronBankMarket[]> {
    const assetsStatic = await this.yearn.services.lens.adapters.ironBank.assetsStatic(addresses, overrides);
    const assetsDynamic = await this.yearn.services.lens.adapters.ironBank.assetsDynamic(addresses, overrides);
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
  async getStatic(addresses?: Address[], overrides?: CallOverrides): Promise<IronBankMarketStatic[]> {
    return await this.yearn.services.lens.adapters.ironBank.assetsStatic(addresses, overrides);
  }

  async getDynamic(addresses?: Address[], overrides?: CallOverrides): Promise<IronBankMarketDynamic[]> {
    return await this.yearn.services.lens.adapters.ironBank.assetsDynamic(addresses, overrides);
  }

  async positionsOf(address: Address, addresses?: Address[], overrides?: CallOverrides): Promise<Position[]> {
    return this.yearn.services.lens.adapters.ironBank.positionsOf(address, addresses, overrides);
  }

  async userMetadata(address: Address, overrides?: CallOverrides): Promise<CyTokenUserMetadata[]> {
    return this.yearn.services.lens.adapters.ironBank.assetsUserMetadata(address, overrides);
  }

  async generalPositionOf(address: Address, overrides?: CallOverrides): Promise<IronBankPosition> {
    return this.yearn.services.lens.adapters.ironBank.generalPositionOf(address, overrides);
  }
}
