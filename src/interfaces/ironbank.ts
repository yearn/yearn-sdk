import { CallOverrides } from "@ethersproject/contracts";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import {
  Address,
  Balance,
  CyTokenUserMetadata,
  IronBankMarket,
  IronBankMarketDynamic,
  IronBankMarketStatic,
  IronBankPosition,
  Position,
  SdkError,
  Token
} from "../types";

export class IronBankInterface<T extends ChainId> extends ServiceInterface<T> {
  /**
   * Get all IronBank markets.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
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

  /**
   * Get static part of IronBank markets.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async getStatic(addresses?: Address[], overrides?: CallOverrides): Promise<IronBankMarketStatic[]> {
    return await this.yearn.services.lens.adapters.ironBank.assetsStatic(addresses, overrides);
  }

  /**
   * Get dynamic part of IronBank markets.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async getDynamic(addresses?: Address[], overrides?: CallOverrides): Promise<IronBankMarketDynamic[]> {
    return await this.yearn.services.lens.adapters.ironBank.assetsDynamic(addresses, overrides);
  }

  /**
   * Get IronBank market positions for a particular address.
   * @param address
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async positionsOf(address: Address, addresses?: Address[], overrides?: CallOverrides): Promise<Position[]> {
    return this.yearn.services.lens.adapters.ironBank.positionsOf(address, addresses, overrides);
  }

  /**
   * Get the IronBank Position for a particular address.
   * @param address
   * @param overrides
   * @returns
   */
  async generalPositionOf(address: Address, overrides?: CallOverrides): Promise<CyTokenUserMetadata> {
    return this.yearn.services.lens.adapters.ironBank.generalPositionOf(address, overrides);
  }

  /**
   * Get the IronBank User Metadata for a particular address.
   * @param address
   * @param overrides
   * @returns
   */
  async userMetadata(address: Address, overrides?: CallOverrides): Promise<IronBankPosition[]> {
    return this.yearn.services.lens.adapters.ironBank.assetsUserMetadata(address, overrides);
  }

  /**
   * Get all IronBank market's underlying token balances for a particular
   * address.
   * @param address
   * @param overrides
   * @returns
   */
  async balances(address: Address, overrides?: CallOverrides): Promise<Balance[]> {
    const tokens = await this.tokens();
    const balances = await this.yearn.services.helper.tokenBalances(
      address,
      tokens.map(token => token.address),
      overrides
    );
    return balances.map(balance => {
      const token = tokens.find(token => token.address === balance.address);
      if (!token) {
        throw new SdkError(`Token does not exist for Balance(${balance.address})`);
      }
      return {
        ...balance,
        token
      };
    });
  }

  /**
   * Get all IronBank market's underlying tokens.
   * @param overrides
   * @returns
   */
  async tokens(overrides?: CallOverrides): Promise<Token[]> {
    const tokenAddresses = await this.yearn.services.lens.adapters.ironBank.tokens(overrides);
    const tokens = await this.yearn.services.helper.tokens(tokenAddresses, overrides);
    const icons = this.yearn.services.icons.get(tokenAddresses);
    return Promise.all(
      tokens.map(async token => ({
        ...token,
        icon: icons[token.address],
        supported: {},
        priceUsdc: await this.yearn.services.oracle.getPriceUsdc(token.address, overrides)
      }))
    );
  }
}
