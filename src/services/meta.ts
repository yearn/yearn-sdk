import { Service } from "../common";
import { Address, SdkError, StrategiesMetadata, TokenMetadata, VaultMetadataOverrides } from "../types";
import { getLocalizedString } from "../utils/localization";

const META_URL = "https://ydaemon.yearn.finance/api";

/**
 * [[MetaService]] fetches meta data about things such as vaults and tokens
 * from yearn-meta
 */
export class MetaService extends Service {
  async tokens(addresses?: Address[]): Promise<TokenMetadata[]> {
    const tokensMetadata: TokenMetadata[] = await fetch(`${META_URL}/tokens/${this.chainId}/all`).then((res) =>
      res.json()
    );

    if (!addresses) {
      return tokensMetadata.map((tokenMetadata: TokenMetadata) => ({
        ...tokenMetadata,
        description: getLocalizedString({
          obj: tokenMetadata,
          property: "description",
          locale: this.ctx.locale,
          fallback: "Token description missing",
        }),
      }));
    }

    return tokensMetadata
      .filter((tokenMetadata: TokenMetadata) => addresses.includes(tokenMetadata.address))
      .map((tokenMetadata: TokenMetadata) => ({
        ...tokenMetadata,
        description: getLocalizedString({
          obj: tokenMetadata,
          property: "description",
          locale: this.ctx.locale,
          fallback: "Token description missing",
        }),
      }));
  }

  async token(address: Address): Promise<TokenMetadata | null> {
    try {
      const response = await fetch(`${META_URL}/tokens/${this.chainId}/${address}`);

      if (!response.ok) {
        throw new SdkError(`Failed to fetch token with address "${address}". HTTP error: ${response.status}`);
      }

      const returnedValue: TokenMetadata = await response.json();

      returnedValue.description = getLocalizedString({
        obj: returnedValue,
        property: "description",
        locale: this.ctx.locale,
        fallback: "Token description missing",
      });

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
