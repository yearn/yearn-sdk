import { Service } from "../common";
import { Address, StrategiesMetadata, TokenMetadata } from "../types";

const MetaURL = "http://meta.yearn.network";

/**
 * [[MetaService]] fetches meta data about things such as vaults and tokens
 * from yearn-meta
 */
export class MetaService extends Service {
  async token(address: Address): Promise<TokenMetadata | undefined> {
    const metadata = await this.fetchMetadataItem<any>(`${MetaURL}/tokens/${address}`);
    const result: TokenMetadata = {
      address: address,
      categories: metadata.categories,
      description: metadata.description,
      website: metadata.website
    };
    return result;
  }

  async strategies(): Promise<StrategiesMetadata[]> {
    const filesRes = await fetch(`${MetaURL}/strategies/index`).then(res => res.json());
    const files: string[] = filesRes.files.filter((file: string) => !file.startsWith("0x"));
    return Promise.all(files.map(async file => fetch(`${MetaURL}/strategies/${file}`).then(res => res.json())));
  }

  private async fetchMetadataItem<T>(url: string): Promise<T | undefined> {
    try {
      return await fetch(url).then(res => res.json());
    } catch (error) {
      return undefined;
    }
  }
}
