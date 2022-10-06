import { ChainId } from "../chain";
import { Service } from "../common";
import { Context } from "../context";
import { Adapters } from "../yearn";
import { RegistryV2Adapter } from "./adapters/registry";
import { AddressProvider } from "./addressProvider";

/**
 * [[LensService]] provides access to all yearn's adapters for assets and user positions.
 */
export class LensService<T extends ChainId> extends Service {
  private addressProvider: AddressProvider<T>;

  constructor(chainId: ChainId, ctx: Context, addressProvider: AddressProvider<T>) {
    super(chainId, ctx);
    this.addressProvider = addressProvider;
  }

  get adapters(): Adapters<T> {
    return {
      vaults: {
        v2: new RegistryV2Adapter(this.chainId, this.ctx, this.addressProvider),
      },
    } as Adapters<T>;
  }
}
