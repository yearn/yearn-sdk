import { JsonRpcProvider, Provider } from "@ethersproject/providers";

import { Address, SdkError } from "./common";
import { inject } from "./override/injector";

export interface AddressesOverride {
  lens?: Address;
  oracle?: Address;
  registryV2Adapter?: Address;
}

export interface ContextValue {
  provider?: Provider;
  zapper?: string;
  etherscan?: string;
  addresses?: AddressesOverride;
}

export interface ContextOptions {
  overrides: boolean;
}

export class Context implements Required<ContextValue> {
  private ctx: ContextValue;

  constructor(ctx: ContextValue, options?: ContextOptions) {
    if (
      options &&
      options.overrides &&
      ctx.provider &&
      ctx.provider instanceof JsonRpcProvider
    ) {
      inject(ctx.provider);
    }
    this.ctx = Object.assign({}, ctx, {
      // https://docs.zapper.fi/build/zapper-api#authentication
      zapper: "96e0cc51-a62e-42ca-acee-910ea7d2a241"
    });
  }

  get provider(): Provider {
    if (this.ctx.provider) return this.ctx.provider;
    throw new SdkError(
      "provider must not be undefined in Context for this feature to work."
    );
  }

  get zapper(): string {
    if (this.ctx.zapper) return this.ctx.zapper;
    throw new SdkError(
      "zapper must not be undefined in Context for this feature to work."
    );
  }

  get etherscan(): string {
    if (this.ctx.etherscan) return this.ctx.etherscan;
    throw new SdkError(
      "etherscan must not be undefined in Context for this feature to work."
    );
  }

  get addresses(): AddressesOverride {
    if (this.ctx.addresses) return this.ctx.addresses;
    return {};
  }

  address(service: keyof AddressesOverride): Address | undefined {
    return this.addresses[service];
  }
}
