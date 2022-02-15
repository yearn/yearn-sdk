import { CallOverrides } from "@ethersproject/contracts";

import { ChainId } from "../chain";
import { ContractService, WrappedContract } from "../common";
import { ContractAddressId } from "../common";
import { structArray } from "../struct";
import { Address, GenericAsset, Position } from "../types";
import { IronBankAdapter } from "./adapters/ironbank";
import { IRegistryAdapter, RegistryV2Adapter } from "./adapters/registry";

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
export class LensService<T extends ChainId> extends ContractService<T> {
  static abi = LensAbi;
  static contractId = ContractAddressId.lens;

  get adapters(): Adapters<T> {
    return {
      vaults: {
        v2: new RegistryV2Adapter(this.chainId, this.ctx, this.addressProvider)
      },
      ironBank: new IronBankAdapter(this.chainId, this.ctx, this.addressProvider)
    } as Adapters<T>;
  }

  get contract(): Promise<WrappedContract> {
    return this._getContract(LensService.abi, LensService.contractId, this.ctx);
  }

  /**
   * Get all the adapter addresses attached to Lens.
   * @param overrides
   * @returns list of registry addresses
   */
  async getAdapters(overrides: CallOverrides = {}): Promise<string[]> {
    let contract = await this.contract;
    return contract.read.getRegistries(overrides);
  }

  /**
   * Get all the assets from all the adapters attached to Lens.
   * @param overrides
   * @returns list of assets
   */
  async getAssets(overrides: CallOverrides = {}): Promise<GenericAsset[]> {
    let contract = await this.contract;
    return contract.read.getAssets(overrides).then(structArray);
  }

  /**
   * Get all positions of a particular assets for all the assets in all the
   * adapters attached to lens.
   * @param address
   * @param overrides
   * @returns list of user positions
   */
  async getPositions(address: string, overrides: CallOverrides = {}): Promise<Position[]> {
    let contract = await this.contract;
    return contract.read.getPositionsOf(address, overrides).then(structArray);
  }

  /**
   * Get all the assets from a specific Lens adapter.
   * @param adapter
   * @param overrides
   * @returns list of assets
   */
  async getAssetsFromAdapter(adapter: Address, overrides: CallOverrides = {}): Promise<GenericAsset[]> {
    let contract = await this.contract;
    return contract.read.getAssetsFromAdapter(adapter, overrides).then(structArray);
  }
}
