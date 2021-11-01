import { Service } from "../common";
import { StrategiesMetadata, TokenMetadata, VaultMetadataOverrides } from "../types";

const MetaURL = "https://meta.yearn.network";

const CHAIN_ID_KEY = "{chain_id}";

/**
 * [[MetaService]] fetches meta data about things such as vaults and tokens
 * from yearn-meta
 */
export class MetaService extends Service {
  async tokens(): Promise<TokenMetadata[]> {
    return fetch(this.buildUrl(`tokens/${CHAIN_ID_KEY}/all`)).then(res => res.json());
  }

  async strategies(): Promise<StrategiesMetadata[]> {
    const files: string[] = await fetch(this.buildUrl(`strategies/${CHAIN_ID_KEY}/index`))
      .then(res => res.json())
      .then(json => json.files.filter((file: string) => !file.startsWith("0x")));

    return Promise.all(
      files.map(file => fetch(this.buildUrl(`strategies/${CHAIN_ID_KEY}/${file}`)).then(res => res.json()))
    );
  }

  async vaults(): Promise<VaultMetadataOverrides[]> {
    return fetch(this.buildUrl(`vaults/${CHAIN_ID_KEY}/all`)).then(res => res.json());
  }

  private buildUrl(path: string): string {
    return `${MetaURL}/${path}`.replace(CHAIN_ID_KEY, this.chainId.toString());
  }
}
