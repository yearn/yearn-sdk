import { Service } from "../common";
import { Address, StrategiesMetadata, TokenMetadata, VaultMetadataOverrides } from "../types";

const MetaURL = "https://meta.yearn.network";

interface IPFSIndex {
  files: string[];
  directories: string[];
}

const CHAIN_ID_KEY = "{chain_id}";

/**
 * [[MetaService]] fetches meta data about things such as vaults and tokens
 * from yearn-meta
 */
export class MetaService extends Service {
  async token(address: Address): Promise<TokenMetadata | undefined> {
    const metadata = await this.fetchMetadataItem<any>(this.buildUrl(`tokens/${CHAIN_ID_KEY}/${address}`));
    if (!metadata) {
      return undefined;
    }
    const result: TokenMetadata = {
      address: address,
      categories: metadata.categories,
      description: metadata.description,
      website: metadata.website,
      tokenIconOverride: metadata.tokenIconOverride,
      tokenSymbolOverride: metadata.tokenSymbolOverride,
      tokenNameOverride: metadata.tokenNameOverride
    };
    return result;
  }

  async strategies(): Promise<StrategiesMetadata[]> {
    const files: string[] = await fetch(this.buildUrl(`strategies/${CHAIN_ID_KEY}/index`))
      .then(res => res.json())
      .then(json => json.files);
    return Promise.all(files.map(async file => fetch(`${MetaURL}/strategies/${file}`).then(res => res.json())));
  }

  async vaults(): Promise<VaultMetadataOverrides[]> {
    const index: IPFSIndex = await fetch(this.buildUrl(`vaults/${CHAIN_ID_KEY}/index`)).then(res => res.json());

    const promises = index.files.map(async file => {
      const metadata = await fetch(this.buildUrl(`vaults/${CHAIN_ID_KEY}/${file}`)).then(res => res.json());
      const vaultMetadata: VaultMetadataOverrides = {
        address: file,
        comment: metadata.comment,
        hideAlways: metadata.hideAlways,
        depositsDisabled: metadata.depositsDisabled,
        withdrawalsDisabled: metadata.withdrawalsDisabled,
        apyOverride: metadata.apyOverride,
        apyTypeOverride: metadata.apyTypeOverride,
        order: metadata.order,
        migrationAvailable: metadata.migrationAvailable,
        allowZapIn: metadata.allowZapIn,
        allowZapOut: metadata.allowZapOut,
        displayName: metadata.displayName,
        migrationContract: metadata.migrationContract,
        migrationTargetVault: metadata.migrationTargetVault,
        vaultIconOverride: metadata.vaultIconOverride,
        vaultSymbolOverride: metadata.vaultSymbolOverride,
        vaultNameOverride: metadata.vaultNameOverride,
        vaultDetailPageAssets: metadata.vaultDetailPageAssets
      };
      return vaultMetadata;
    });

    return Promise.all(promises);
  }

  private async fetchMetadataItem<T>(url: string): Promise<T | undefined> {
    try {
      return await fetch(url).then(res => res.json());
    } catch (error) {
      return undefined;
    }
  }

  private buildUrl(path: string): string {
    return `${MetaURL}/${path}`.replace(CHAIN_ID_KEY, this.chainId.toString());
  }
}
