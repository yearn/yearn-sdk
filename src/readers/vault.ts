import { Address, Balance, SdkError, Token, VaultDynamic, VaultStatic } from "../types";
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

  async getStatic(addresses?: Address[]): Promise<VaultStatic[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        return await adapter.assetsStatic(addresses);
      })
    ).then(arr => arr.flat());
  }

  async getDynamic(addresses?: Address[]): Promise<VaultDynamic[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        return await adapter.assetsDynamic(addresses);
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

  async balances(address: Address): Promise<Balance[]> {
    const tokens = await this.tokens();
    const balances = await this.yearn.services.helper.tokenBalances(
      address,
      tokens.map(token => token.address)
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

  async tokens(): Promise<Token[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        const tokenAddresses = await adapter.tokens();
        const tokens = await this.yearn.services.helper.tokens(tokenAddresses);
        const icons = this.yearn.services.icons.get(tokenAddresses);
        return Promise.all(
          tokens.map(async token => ({
            ...token,
            icon: icons[token.address],
            supported: {},
            priceUsdc: await this.yearn.services.oracle.getPriceUsdc(token.address)
          }))
        );
      })
    ).then(arr => arr.flat());
  }
}
