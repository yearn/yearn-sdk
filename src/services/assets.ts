import fetch from "cross-fetch";

import { ChainId } from "../chain";
import { Service } from "../common";
import { Context } from "../context";
import { handleHttpError, WethAddress } from "../helpers";
import { Address, Alias, AliasMap, AssetServiceState, Icon, IconMap } from "../types";

const YearnAliases = "https://raw.githubusercontent.com/yearn/yearn-assets/master/icons/aliases.json";
const YearnAssets = (chainId: ChainId): string =>
  `https://api.github.com/repos/yearn/yearn-assets/contents/icons/multichain-tokens/${chainId}`;
const TrustAssets = "https://raw.githack.com/trustwallet/assets/master/blockchains/ethereum/tokenlist.json";

const YearnAsset = (address: Address, chainId: ChainId): string =>
  `https://raw.githack.com/yearn/yearn-assets/master/icons/multichain-tokens/${chainId}/${address}/logo-128.png`;
const YearnAssetAlt = (address: Address, chainId: ChainId): string =>
  `https://raw.githack.com/yearn/yearn-assets/master/icons/multichain-tokens/${chainId}/${address}/logo-alt-128.png`;
const TrustAsset = (address: Address): string =>
  `https://raw.githack.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;

/**
 * [[AssetService]] fetches correct icons & aliases related to eth addresses
 * from trusted asset sources
 */
export class AssetService extends Service {
  static deserializeState(data: string): AssetServiceState {
    const obj = JSON.parse(data);
    const supported = new Map<Address, string>(JSON.parse(obj.supported));
    const aliases = new Map<Address, Alias>(JSON.parse(obj.aliases));
    return { supported, aliases };
  }

  ready: Promise<void>;
  supported: Map<Address, string>;
  aliases: Map<Address, Alias>;

  private alts = [WethAddress];

  constructor(chainId: ChainId, ctx: Context, state?: AssetServiceState) {
    super(chainId, ctx);
    if (state) {
      this.supported = state.supported;
      this.aliases = state.aliases;
      this.ready = Promise.resolve();
    } else {
      this.supported = new Map();
      this.aliases = new Map();
      this.ready = this.initialize();
    }
  }

  async makeSerializedState(): Promise<string> {
    await this.ready;
    const supportedJson = JSON.stringify(Array.from(this.supported.entries()));
    const aliasesJson = JSON.stringify(Array.from(this.aliases.entries()));
    return JSON.stringify({ supported: supportedJson, aliases: aliasesJson });
  }

  private async initialize(): Promise<void> {
    if (this.chainId === 1 || this.chainId === 1337) {
      const aliases: Alias[] = await fetch(YearnAliases)
        .then(handleHttpError)
        .then((res) => res.json())
        .catch((error) => {
          console.error(error);
          return [];
        });

      for (const alias of aliases) {
        this.aliases.set(alias.address, alias);
      }

      const trust = await fetch(TrustAssets)
        .then(handleHttpError)
        .then((res) => res.json())
        .then((res) => res.tokens)
        .catch((error) => {
          console.error(error);
          return [];
        });

      for (const token of trust) {
        this.supported.set(token.address, TrustAsset(token.address));
      }
    }

    const yearn = await fetch(YearnAssets(this.chainId))
      .then(handleHttpError)
      .then((res) => res.json())
      .catch((error) => {
        console.error(error);
        return [];
      });

    for (const token of yearn) {
      this.supported.set(token.name, YearnAsset(token.name, this.chainId));
      if (this.alts.includes(token.name)) {
        this.supported.set(token.name, YearnAssetAlt(token.name, this.chainId));
      } else {
        this.supported.set(token.name, YearnAsset(token.name, this.chainId));
      }
    }
  }

  /**
   * Get an icon url for a particular address.
   * @param address
   */
  icon<T extends Address>(address: T): Icon;

  /**
   * Get a map of icons for a list of addresses.
   * @param addresses
   */
  icon<T extends Address>(addresses: T[]): IconMap<T>;

  icon<T extends Address>(address: T | T[]): IconMap<T> | Icon;
  icon<T extends Address>(address: T | T[]): IconMap<T> | Icon {
    if (!Array.isArray(address)) {
      return this.supported.get(address);
    }
    return Object.fromEntries(address.map((address) => [address, this.supported.get(address)])) as IconMap<T>;
  }

  /**
   * Get an alias for a particular address.
   * @param address
   */
  alias<T extends Address>(address: T): Alias | undefined;

  /**
   * Get a map of aliases for a list of addresses.
   * @param addresses
   */
  alias<T extends Address>(addresses: T[]): AliasMap<T>;

  alias<T extends Address>(address: T | T[]): AliasMap<T> | Alias | undefined;
  alias<T extends Address>(address: T | T[]): AliasMap<T> | Alias | undefined {
    if (!Array.isArray(address)) {
      return this.aliases.get(address);
    }
    return Object.fromEntries(address.map((address) => [address, this.aliases.get(address)])) as AliasMap<T>;
  }
}
