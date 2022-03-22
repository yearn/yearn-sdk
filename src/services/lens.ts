import { CallOverrides } from "@ethersproject/contracts";

import { ChainId } from "../chain";
import { ContractService, WrappedContract } from "../common";
import { ContractAddressId } from "../common";
import { structArray } from "../struct";
import { Address, GenericAsset, Position } from "../types";
import { Adapters } from "../yearn";
import { IronBankAdapter } from "./adapters/ironbank";
import { RegistryV2Adapter } from "./adapters/registry";

export const LensAbi = ["function getRegistries() external view returns (address[] memory)"];

/**
 * [[LensService]] provides access to all yearn's assets and user positions.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 *
 * @deprecated since v1.2.2. Adapters accessed via [[LensService]] should
 * now be accessed directly from the Yearn SDK object.
 */
export class LensService<T extends ChainId> extends ContractService<T> {
  static abi = LensAbi;
  // unused contract id as the contract doesn't exist and will be deprecated soon
  static contractId = ContractAddressId.unused;

  get adapters(): Adapters<T> {
    console.warn("Using method in deprecated service. Please use the adapters object in the Yearn SDK object instead.");
    return {
      vaults: {
        v2: new RegistryV2Adapter(this.chainId, this.ctx, this.addressProvider)
      },
      ironBank: new IronBankAdapter(this.chainId, this.ctx, this.addressProvider)
    } as Adapters<T>;
  }

  get contract(): Promise<WrappedContract> {
    console.warn("Fetching a deprecated contract. This contract address does not exist onchain anymore.");
    return this._getContract(LensService.abi, LensService.contractId, this.ctx);
  }

  /**
   * Get all the adapter addresses attached to Lens.
   * @deprecated since v1.2.2
   * @param overrides
   * @returns list of registry addresses
   */
  async getAdapters(overrides: CallOverrides = {}): Promise<string[]> {
    const contract = await this.contract;
    return contract.read.getRegistries(overrides);
  }

  /**
   * Get all the assets from all the adapters attached to Lens.
   * @deprecated since v1.2.2
   * @param overrides
   * @returns list of assets
   */
  async getAssets(overrides: CallOverrides = {}): Promise<GenericAsset[]> {
    const contract = await this.contract;
    return contract.read.getAssets(overrides).then(structArray);
  }

  /**
   * Get all positions of a particular assets for all the assets in all the
   * adapters attached to lens.
   * @deprecated since v1.2.2
   * @param address
   * @param overrides
   * @returns list of user positions
   */
  async getPositions(address: string, overrides: CallOverrides = {}): Promise<Position[]> {
    const contract = await this.contract;
    return contract.read.getPositionsOf(address, overrides).then(structArray);
  }

  /**
   * Get all the assets from a specific Lens adapter.
   * @deprecated since v1.2.2
   * @param adapter
   * @param overrides
   * @returns list of assets
   */
  async getAssetsFromAdapter(adapter: Address, overrides: CallOverrides = {}): Promise<GenericAsset[]> {
    const contract = await this.contract;
    return contract.read.getAssetsFromAdapter(adapter, overrides).then(structArray);
  }
}
