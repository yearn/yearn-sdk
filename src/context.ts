import { JsonRpcProvider, Provider } from "@ethersproject/providers";

import { SdkError } from "./common";
import { inject } from "./override/injector";

interface IContext {
  provider: Provider;
  zapper: string;
  etherscan: string;
}

export type ContextValue = Partial<IContext>;

export class Context implements IContext {
  private ctx: ContextValue;

  constructor(ctx: ContextValue) {
    if (ctx.provider && ctx.provider instanceof JsonRpcProvider) {
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
      "zapper must not be undefined in Context for this feature to work."
    );
  }
}
