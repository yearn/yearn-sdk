import { PartialDeep } from "type-fest";
import { Provider } from "@ethersproject/providers";

import { CacheManager, Cache } from "./cache";

import { Address, SdkError } from "./types";
import EventEmitter from "events";

export interface AddressesOverride {
  lens?: Address;
  oracle?: Address;
  adapters: {
    registryV2?: Address;
    ironBank?: Address;
  };
  helper?: Address;
}

export interface ReadWriteProvider {
  read: Provider;
  write: Provider;
}

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

export class Context implements Required<ContextValue> {
  static PROVIDER = "refresh:provider";

  private ctx: ContextValue;

  cache: CacheManager;
  events: EventEmitter;

  constructor(ctx: ContextValue, cache?: Cache) {
    this.ctx = Object.assign({}, DefaultContext, ctx);
    this.cache = new CacheManager(cache);
    this.events = new EventEmitter().setMaxListeners(100);
    this.setProvider(ctx.provider);
  }

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
