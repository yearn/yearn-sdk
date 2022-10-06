import { JsonRpcProvider } from "@ethersproject/providers";
import EventEmitter from "events";
import { PartialDeep } from "type-fest";

import { Address, Locale, SdkError } from "./types";
import { encode } from "./utils";

export interface AddressesOverride {
  lens?: Address;
  oracle?: Address;
  adapters: {
    registryV2?: Address;
  };
  helper?: Address;
  allowList?: Address;
  partner?: Address;
}

/**
 * For particular situations it's helpful to have two separate providers, one
 * for reading data and one for writing data.
 */
export interface ReadWriteProvider {
  read: JsonRpcProvider;
  write: JsonRpcProvider;
}

/**
 * To provide configuration for simulation error reporting
 */
export interface SimulationConfiguration extends TelegramConfiguration {
  dashboardUrl?: string;
}

/**
 * Provides details about sending a message from a telegram bot to a
 * specific chat
 */
export interface TelegramConfiguration {
  telegramChatId?: string;
  telegramBotId?: string;
}

export interface CacheConfiguration {
  useCache: boolean;
  url?: string;
}

export interface SubgraphConfiguration {
  mainnetSubgraphEndpoint?: string;
  fantomSubgraphEndpoint?: string;
  arbitrumSubgraphEndpoint?: string;
  optimismSubgraphEndpoint?: string;
}

/**
 * Context options that are used to access all the data sources queried by the
 * SDK.
 */
export interface ContextValue {
  provider?: JsonRpcProvider | ReadWriteProvider;
  zapper?: string;
  etherscan?: string;
  addresses?: PartialDeep<AddressesOverride>;
  simulation?: SimulationConfiguration;
  cache?: CacheConfiguration;
  subgraph?: SubgraphConfiguration;
  partnerId?: string;
  locale?: Locale;
}

const DefaultContext: ContextValue = {
  // Public API key provided by zapper.
  // see https://docs.zapper.fi/zapper-api/endpoints
  zapper: "96e0cc51-a62e-42ca-acee-910ea7d2a241",
  // The default tenderly dashboard for Yearn
  simulation: { dashboardUrl: "https://dashboard.tenderly.co/yearn/yearn-web" },
  cache: { useCache: true, url: "https://cache.yearn.finance" },
};

/**
 * [[Context]] is the configuration object passed around every function in
 * the SDK. It contains basic information on how to access the various services
 * that the SDK aggregates.
 *
 * [[Context]] **should not** be instantiated by users, as it's managed by
 * {@link Yearn.context}.
 */
export class Context implements ContextValue {
  static PROVIDER = "refresh:provider";

  private ctx: ContextValue;

  /**
   * For internal events only.
   */
  events: EventEmitter;

  constructor(ctx: ContextValue) {
    this.ctx = Object.assign({}, DefaultContext, ctx);
    this.events = new EventEmitter().setMaxListeners(100);
    this.setProvider(ctx.provider);
  }

  /**
   * Change providers during executions for all services that require on-chain
   * interaction.
   * @param provider new provider(s)
   */
  setProvider(provider?: JsonRpcProvider | ReadWriteProvider): void {
    if (provider instanceof JsonRpcProvider) {
      this.ctx.provider = { read: provider, write: provider };
    } else if (provider) {
      this.ctx.provider = provider;
    }
    this.events.emit(Context.PROVIDER, this.ctx.provider);
  }

  get provider(): ReadWriteProvider {
    if (this.ctx.provider) return this.ctx.provider as ReadWriteProvider;
    throw new SdkError("provider must be undefined in Context for this feature to work.");
  }

  get zapper(): string {
    if (this.ctx.zapper) return encode({ str: `${this.ctx.zapper}:`, encoding: "base64" });
    throw new SdkError("zapper must be undefined in Context for this feature to work.");
  }

  get etherscan(): string {
    if (this.ctx.etherscan) return this.ctx.etherscan;
    throw new SdkError("etherscan must be undefined in Context for this feature to work.");
  }

  get addresses(): AddressesOverride {
    return Object.assign({ adapters: {} }, this.ctx.addresses);
  }

  set addresses(addresses: AddressesOverride) {
    this.ctx.addresses = addresses;
  }

  get simulation(): SimulationConfiguration {
    if (this.ctx.simulation) return this.ctx.simulation;
    throw new SdkError("simulation configuration must be defined in Context for this feature to work.");
  }

  get cache(): CacheConfiguration {
    if (this.ctx.cache) return this.ctx.cache;
    throw new SdkError("cache must be defined in Context for this feature to work.");
  }

  get subgraph(): SubgraphConfiguration | undefined {
    return this.ctx.subgraph;
  }

  get partnerId(): string | undefined {
    return this.ctx.partnerId;
  }

  get locale(): Locale {
    return this.ctx.locale || "en";
  }
}
