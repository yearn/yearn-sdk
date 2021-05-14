import { Address, GenericAsset, Position } from "../types";
import { ContractService } from "../common";
import { ChainId } from "../chain";
import { structArray } from "../struct";
import { Context } from "../context";

import { IRegistryAdapter, RegistryV2Adapter } from "./adapters/registry";
import { IronBankAdapter } from "./adapters/ironbank";

// FIXME: no
export const LensAbi = ["function getRegistries() external view returns (address[] memory)"];

export type Adapters<T extends ChainId> = {
  vaults: {
    v1: IRegistryAdapter;
    v2: RegistryV2Adapter<T>;
  };
  ironBank: IronBankAdapter<T>;
};

/**
 * [[LensService]] provides access to all yearn's assets and user positions.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */
export class LensService<T extends ChainId> extends ContractService {
  static abi = LensAbi;

  constructor(chainId: T, ctx: Context) {
    super(ctx.addresses.lens ?? LensService.addressByChain(chainId), chainId, ctx);
  }

  get adapters(): Adapters<T> {
    switch (this.chainId) {
      case 1: // FIXME: doesn't actually exist
      case 250: // ditto
      case 1337: // ditto
        return {
          vaults: {
            v2: new RegistryV2Adapter(this.chainId, this.ctx)
          },
          ironBank: new IronBankAdapter(this.chainId, this.ctx)
        } as Adapters<T>; // FIXME: missing adapters
    }
    throw TypeError(`No lens adapter for chainId "${this.chainId}".`);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1: // FIXME: doesn't actually exist
      case 250: // ditto
      case 1337: // ditto
        return "0xFa58130BE296EDFA23C42a1d15549fA91449F979";
    }
  }

  async getRegistries(): Promise<string[]> {
    return await this.contract.read.getRegistries();
  }

  async getAssets(): Promise<GenericAsset[]> {
    return await this.contract.read.getAssets().then(structArray);
  }

  async getAssetsFromAdapter(adapter: Address): Promise<GenericAsset[]> {
    return await this.contract.read.getAssetsFromAdapter(adapter).then(structArray);
  }

  async getPositions(address: string): Promise<Position[]> {
    return await this.contract.read.getPositionsOf(address).then(structArray);
  }
}
