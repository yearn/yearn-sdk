import { Provider } from "@ethersproject/providers";
import EventEmitter from "events";
import { PartialDeep } from "type-fest";

import { Address, SdkError } from "./types";

export interface AddressesOverride {
  lens?: Address;
  oracle?: Address;
  adapters: {
    registryV2?: Address;
    ironBank?: Address;
  };
  helper?: Address;
}

/**
 * For particular situations it's helpful to have two separate providers, one
 * for reading data and one for writing data.
 */
export interface ReadWriteProvider {
  read: Provider;
  write: Provider;
}

/**
 * Context options that are used to access all the data sources queried by the
 * SDK.
 */
export interface ContextValue {
  provider?: Provider | ReadWriteProvider;
  zapper?: string;
  etherscan?: string;
  addresses?: PartialDeep<AddressesOverride>;
}

const DefaultContext = {
  // Public API key provided by zapper.
  // see https://docs.zapper.fi/zapper-api/endpoints
  zapper: "96e0cc51-a62e-42ca-acee-910ea7d2a241"
};

/**
 * [[Context]] is the configuration object passed around every function in
 * the SDK. It contains basic information on how to access the various services
 * that the SDK aggregates.
 *
 * [[Context]] **should not** be instantiated by users, as it's managed by
 * {@link Yearn.context}.
 */
export class Context implements Required<ContextValue> {
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
  setProvider(provider?: Provider | ReadWriteProvider) {
    if (provider instanceof Provider) {
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
    if (this.ctx.zapper) return this.ctx.zapper;
    throw new SdkError("zapper must be undefined in Context for this feature to work.");
  }

  get etherscan(): string {
    if (this.ctx.etherscan) return this.ctx.etherscan;
    throw new SdkError("etherscan must be undefined in Context for this feature to work.");
  }

  get addresses(): AddressesOverride {
    return Object.assign({ adapters: {} }, this.ctx.addresses);
  }
}
