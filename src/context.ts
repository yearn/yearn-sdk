import { PartialDeep } from "type-fest";
import { Provider } from "@ethersproject/providers";

import { CacheManager, Cache } from "./cache";

import { Address, SdkError } from "./common";

export interface AddressesOverride {
  lens?: Address;
  oracle?: Address;
  adapters: {
    registryV2?: Address;
    ironBank?: Address;
  };
  helper?: Address;
}

export interface ContextValue {
  provider?: Provider;
  zapper?: string;
  etherscan?: string;
  addresses?: PartialDeep<AddressesOverride>;
}

export class Context implements Required<ContextValue> {
  private ctx: ContextValue;
  cache: CacheManager;

  constructor(ctx: ContextValue, cache?: Cache) {
    this.ctx = Object.assign({}, ctx, {
      // Public API key provided by zapper.
      // see https://docs.zapper.fi/zapper-api/endpoints
      zapper: "96e0cc51-a62e-42ca-acee-910ea7d2a241"
    });
    this.cache = new CacheManager(cache);
  }

  get provider(): Provider {
    if (this.ctx.provider) return this.ctx.provider;
    throw new SdkError("provider must not be undefined in Context for this feature to work.");
  }

  get zapper(): string {
    if (this.ctx.zapper) return this.ctx.zapper;
    throw new SdkError("zapper must not be undefined in Context for this feature to work.");
  }

  get etherscan(): string {
    if (this.ctx.etherscan) return this.ctx.etherscan;
    throw new SdkError("etherscan must not be undefined in Context for this feature to work.");
  }

  get addresses(): AddressesOverride {
    return Object.assign({ adapters: {} }, this.ctx.addresses);
  }
}
