import { Service } from "../common";
import { Address, StrategiesMetadata, TokenMetadata, VaultMetadataOverrides } from "../types";

const META_URL = "https://meta.yearn.network";

/**
 * [[MetaService]] fetches meta data about things such as vaults and tokens
 * from yearn-meta
 */
export class MetaService extends Service {
  async tokens(addresses?: Address[]): Promise<TokenMetadata[]> {
    if (!addresses) {
      return fetch(`${META_URL}/tokens/${this.chainId}/all`).then(res => res.json());
    }

    return Promise.all(
      addresses.map(address => fetch(`${META_URL}/tokens/${this.chainId}/${address}`).then(e => e.json()))
    ).then(data => data.flat());
  }

  async token(address: Address): Promise<TokenMetadata> {
    return fetch(`${META_URL}/tokens/${this.chainId}/${address}`).then(res => res.json());
  }

  async strategies(): Promise<StrategiesMetadata[]> {
    return fetch(`${META_URL}/strategies/${this.chainId}/all`).then(res => res.json());
  }

  async vaults(addresses?: Address[]): Promise<VaultMetadataOverrides[]> {
    if (!addresses) {
      return fetch(`${META_URL}/vaults/${this.chainId}/all`).then(res => res.json());
    }

    return Promise.all(
      addresses.map(address => fetch(`${META_URL}/vaults/${this.chainId}/${address}`).then(e => e.json()))
    ).then(data => data.flat());
  }

  async vault(address: Address): Promise<VaultMetadataOverrides> {
    return fetch(`${META_URL}/vaults/${this.chainId}/${address}`).then(res => res.json());
  }
}
