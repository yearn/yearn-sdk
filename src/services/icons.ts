import { ChainId } from "../chain";
import { Service } from "../common";
import { Context } from "../context";
import { handleHttpError } from "../helpers";
import { Address, Icon, IconMap } from "../types";

const YearnAssets = "https://api.github.com/repos/yearn/yearn-assets/contents/icons/tokens";
const TrustAssets = "https://raw.githack.com/trustwallet/assets/master/blockchains/ethereum/tokenlist.json";

const YearnAsset = (address: Address) =>
  `https://raw.githack.com/yearn/yearn-assets/master/icons/tokens/${address}/logo-128.png`;
const TrustAsset = (address: Address) =>
  `https://raw.githack.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;

/**
 * [[IconsService]] fetches correct icons related to eth addresses
 * from trusted asset sources
 */
export class IconsService extends Service {
  ready: Promise<void>;
  supported: Map<Address, string>;

  constructor(chainId: ChainId, ctx: Context) {
    super(chainId, ctx);
    this.supported = new Map();
    this.ready = this.initialize();
  }

  private async initialize(): Promise<void> {
    const yearn = await fetch(YearnAssets)
      .then(handleHttpError)
      .then(res => res.json())
      .catch(console.error); // FIXME: remove
    const trust = await fetch(TrustAssets)
      .then(handleHttpError)
      .then(res => res.json())
      .then(res => res.tokens)
      .catch(console.error); // FIXME: remove

    this.supported = new Map();
    for (const token of trust) {
      this.supported.set(token.address, TrustAsset(token.address));
    }

    for (const token of yearn) {
      this.supported.set(token.name, YearnAsset(token.name));
    }
  }

  /**
   * Get an icon url for a particular address.
   * @param address
   */
  get<T extends Address>(address: T): Icon;

  /**
   * Get a map of icons for a list of addresses.
   * @param addresses
   */
  get<T extends Address>(addresses: T[]): IconMap<T>;

  get<T extends Address>(address: T | T[]): IconMap<T> | Icon;
  get<T extends Address>(address: T | T[]): IconMap<T> | Icon {
    if (!Array.isArray(address)) {
      return this.supported.get(address);
    }
    return Object.fromEntries(address.map(address => [address, this.supported.get(address)])) as IconMap<T>;
  }
}
