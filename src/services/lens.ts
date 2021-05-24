import { Address, GenericAsset, Position, SdkError } from "../types";
import { ContractService } from "../common";
import { ChainId } from "../chain";
import { structArray } from "../struct";
import { Context } from "../context";

import { IRegistryAdapter, RegistryV2Adapter } from "./adapters/registry";
import { IronBankAdapter } from "./adapters/ironbank";
import { CallOverrides } from "@ethersproject/contracts";

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
    throw new SdkError(`No lens adapter for chainId "${this.chainId}".`);
  }

  /**
   * Get most up-to-date address of the Lens contract for a particular chain id.
   * @param chainId
   * @returns address
   */
  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1: // FIXME: doesn't actually exist
      case 250: // ditto
      case 1337: // ditto
        return "0xFa58130BE296EDFA23C42a1d15549fA91449F979";
    }
  }

  /**
   * Get all the adapter addresses attached to Lens.
   * @param overrides
   * @returns list of registry addresses
   */
  async getAdapters(overrides: CallOverrides = {}): Promise<string[]> {
    return await this.contract.read.getRegistries(overrides);
  }

  /**
   * Get all the assets from all the adapters attached to Lens.
   * @param overrides
   * @returns list of assets
   */
  async getAssets(overrides: CallOverrides = {}): Promise<GenericAsset[]> {
    return await this.contract.read.getAssets(overrides).then(structArray);
  }

  /**
   * Get all positions of a particular assets for all the assets in all the
   * adapters attached to lens.
   * @param address
   * @param overrides
   * @returns list of user positions
   */
  async getPositions(address: string, overrides: CallOverrides = {}): Promise<Position[]> {
    return await this.contract.read.getPositionsOf(address, overrides).then(structArray);
  }

  /**
   * Get all the assets from a specific Lens adapter.
   * @param adapter
   * @param overrides
   * @returns list of assets
   */
  async getAssetsFromAdapter(adapter: Address, overrides: CallOverrides = {}): Promise<GenericAsset[]> {
    return await this.contract.read.getAssetsFromAdapter(adapter, overrides).then(structArray);
  }
}
