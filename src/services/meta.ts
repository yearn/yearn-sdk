import { Service } from "../common";
import { Address, SdkError, StrategiesMetadata, TokenMetadata, VaultMetadataOverrides } from "../types";

const META_URL = "https://meta.yearn.network";

/**
 * [[MetaService]] fetches meta data about things such as vaults and tokens
 * from yearn-meta
 */
export class MetaService extends Service {
  async tokens(addresses?: Address[]): Promise<TokenMetadata[]> {
    const tokensMetadata: TokenMetadata[] = await fetch(`${META_URL}/tokens/${this.chainId}/all`).then((res) => res.json());

    if (!addresses) {
      return tokensMetadata.map((tokenMetadata: TokenMetadata) => ({
        ...tokenMetadata,
        description: tokenMetadata.localization[this.ctx.locale].description ?? "I don't have a description for this token yet"
      }));
    }

    return tokensMetadata.filter((tokenMetadata: TokenMetadata) => addresses.includes(tokenMetadata.address)).map((tokenMetadata: TokenMetadata) => ({
      ...tokenMetadata,
      description: tokenMetadata.localization[this.ctx.locale].description ?? "I don't have a description for this token yet"
    }));
  }

  async token(address: Address): Promise<TokenMetadata | null> {
    try {
      const response = await fetch(`${META_URL}/tokens/${this.chainId}/${address}`);

      if (!response.ok) {
        throw new SdkError(`Failed to fetch token with address "${address}". HTTP error: ${response.status}`);
      }

      const returnedValue: TokenMetadata = await response.json();

      returnedValue.description = returnedValue.localization[this.ctx.locale].description ?? "I don't have a description for this token yet"

      return returnedValue;
    } catch (error) {
      console.error(error);
    }

    return null;
  }

  async strategies(): Promise<StrategiesMetadata[]> {
    return fetch(`${META_URL}/strategies/${this.chainId}/all`).then((res) => res.json());
  }

  async vaults(addresses?: Address[]): Promise<VaultMetadataOverrides[]> {
    const vaultsMetadata = await fetch(`${META_URL}/vaults/${this.chainId}/all`).then((res) => res.json());

    if (!addresses) {
      return vaultsMetadata;
    }

    return vaultsMetadata.filter((vaultMetadata: VaultMetadataOverrides) => addresses.includes(vaultMetadata.address));
  }

  async vault(address: Address): Promise<VaultMetadataOverrides | null> {
    try {
      const response = await fetch(`${META_URL}/vaults/${this.chainId}/${address}`);

      if (!response.ok) {
        throw new SdkError(`Failed to fetch token with address "${address}". HTTP error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(error);
    }

    return null;
  }
}
