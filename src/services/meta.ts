import { Service } from "../common";
import { Address, TokenMetadata } from "../types";

const MetaURL = "https://raw.githubusercontent.com/yearn/yearn-meta/master/data/";

/**
 * [[MetaService]] fetches meta data about things such as vaults and tokens
 * from yearn-meta
 */
export class MetaService extends Service {
  async token(address: Address): Promise<TokenMetadata | undefined> {
    try {
      return await fetch(`${MetaURL}/tokens/${address}.json`).then(res => res.json());
    } catch (error) {
      return undefined;
    }
  }
}
