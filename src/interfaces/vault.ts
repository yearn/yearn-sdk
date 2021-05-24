import { CallOverrides } from "@ethersproject/contracts";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { Address, Balance, SdkError, Token, VaultDynamic, VaultStatic } from "../types";
import { Position, Vault } from "../types";

export class VaultInterface<T extends ChainId> extends ServiceInterface<T> {
  /**
   * Get all yearn vaults.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async get(addresses?: Address[], overrides?: CallOverrides): Promise<Vault[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        const assetsStatic = await adapter.assetsStatic(addresses, overrides);
        const assetsDynamic = await adapter.assetsDynamic(addresses, overrides);
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

  /**
   * Get static part of yearn vaults.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async getStatic(addresses?: Address[], overrides?: CallOverrides): Promise<VaultStatic[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        return await adapter.assetsStatic(addresses, overrides);
      })
    ).then(arr => arr.flat());
  }

  /**
   * Get dynamic part of yearn vaults.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async getDynamic(addresses?: Address[], overrides?: CallOverrides): Promise<VaultDynamic[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        return await adapter.assetsDynamic(addresses, overrides);
      })
    ).then(arr => arr.flat());
  }

  /**
   * Get yearn vault positions for a particular address.
   * @param address
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async positionsOf(address: Address, addresses?: Address[], overrides?: CallOverrides): Promise<Position[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(adapter => {
        return adapter.positionsOf(address, addresses, overrides);
      })
    ).then(arr => arr.flat());
  }

  /**
   * Get all yearn vault's underlying token balances for a particular address.
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
   * Get all yearn vault's underlying tokens.
   * @param overrides
   * @returns
   */
  async tokens(overrides?: CallOverrides): Promise<Token[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        const tokenAddresses = await adapter.tokens(overrides);
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
      })
    ).then(arr => arr.flat());
  }
}
