import { Service } from "../common";
import { Address, StrategiesMetadata, TokenMetadata, VaultMetadataOverrides } from "../types";

const META_URL = "https://meta.yearn.network";

/**
 * [[MetaService]] fetches meta data about things such as vaults and tokens
 * from yearn-meta
 */
export class MetaService extends Service {
  async tokens(addresses?: Address[]): Promise<TokenMetadata[]> {
    const tokensMetadata = await fetch(`${META_URL}/tokens/${this.chainId}/all`).then(res => res.json());

    if (!addresses) {
      return tokensMetadata;
    }

    return tokensMetadata.filter((tokenMetadata: TokenMetadata) => addresses.includes(tokenMetadata.address));
  }

  async token(address: Address): Promise<TokenMetadata> {
    return fetch(`${META_URL}/tokens/${this.chainId}/${address}`).then(res => res.json());
  }

  async strategies(): Promise<StrategiesMetadata[]> {
    return fetch(`${META_URL}/strategies/${this.chainId}/all`).then(res => res.json());
  }

  async vaults(addresses?: Address[]): Promise<VaultMetadataOverrides[]> {
    const vaultsMetadata = await fetch(`${META_URL}/vaults/${this.chainId}/all`).then(res => res.json());

    if (!addresses) {
      return vaultsMetadata;
    }

    return vaultsMetadata.filter((vaultMetadata: VaultMetadataOverrides) => addresses.includes(vaultMetadata.address));
  }

  async vault(address: Address): Promise<VaultMetadataOverrides> {
    return fetch(`${META_URL}/vaults/${this.chainId}/${address}`).then(res => res.json());
  }
}
