import { CallOverrides } from "@ethersproject/contracts";

import { AdapterAbi } from "../../abi";
import { ChainId } from "../../chain";
import { ContractAddressId, ContractService, WrappedContract } from "../../common";
import { ZeroAddress } from "../../helpers";
import { structArray } from "../../struct";
import { Address, Position, VaultDynamic, VaultStatic } from "../../types";

export interface IRegistryAdapter {
  assetsStatic(addresses?: Address[], overrides?: CallOverrides): Promise<VaultStatic[]>;
  assetsDynamic(addresses?: Address[], overrides?: CallOverrides): Promise<VaultDynamic[]>;
  positionsOf(address: Address, addresses?: Address[], overrides?: CallOverrides): Promise<Position[]>;
  tokens(overrides?: CallOverrides): Promise<Address[]>;
}

const VaultV2MetadataAbi = `tuple(
  uint256 pricePerShare,
  bool migrationAvailable,
  address latestVaultAddress,
  uint256 depositLimit,
  bool emergencyShutdown
)`;

export class RegistryV2Adapter<T extends ChainId> extends ContractService<T> implements IRegistryAdapter {
  static abi = AdapterAbi(VaultV2MetadataAbi);
  static contractId = ContractAddressId.adapter_registry_v2;

  get contract(): Promise<WrappedContract> {
    return this._getContract(RegistryV2Adapter.abi, RegistryV2Adapter.contractId, this.ctx);
  }

  /**
   * Get the static part of Vault assets.
   * @param addresses filter, if not provided all assets are returned
   * @param overrides
   * @returns static
   */
  async assetsStatic(addresses?: Address[], overrides: CallOverrides = {}): Promise<VaultStatic[]> {
    const contract = await this.contract;
    if (addresses) {
      return contract.read["assetsStatic(address[])"](addresses, overrides).then(structArray);
    }
    return contract.read["assetsStatic()"]().then(structArray);
  }

  /**
   * Get the dynamic part of Vault assets.
   * @param addresses filter, if not provided all assets are returned
   * @param overrides
   * @returns dynamic
   */
  async assetsDynamic(addresses?: Address[], overrides: CallOverrides = {}): Promise<VaultDynamic[]> {
    const contract = await this.contract;
    if (addresses) {
      return contract.read["assetsDynamic(address[])"](addresses, overrides)
        .then(structArray)
        .then((assets: any) =>
          assets.map((asset: any) => ({
            ...asset,
            metadata: {
              controller: ZeroAddress,
              totalAssets: "0",
              totalSupply: "0",
              ...asset.metadata
            }
          }))
        );
    }
    return contract.read["assetsDynamic()"]()
      .then(structArray)
      .then((assets: any) =>
        assets.map((asset: any) => {
          return {
            ...asset,
            metadata: {
              controller: ZeroAddress,
              totalAssets: "0",
              totalSupply: "0",
              ...asset.metadata
            }
          };
        })
      );
  }

  /**
   * Get all Vault asset positions for a particular address.
   * @param address
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */

  async positionsOf(address: Address, addresses?: Address[], overrides: CallOverrides = {}): Promise<Position[]> {
    const contract = await this.contract;
    if (addresses) {
      return contract.read["assetsPositionsOf(address,address[])"](address, addresses, overrides).then(structArray);
    }
    return contract.read["assetsPositionsOf(address)"](address, overrides).then(structArray);
  }

  /**
   * Get all Vault underlying token addresses.
   * @param overrides
   * @returns
   */
  async tokens(overrides: CallOverrides = {}): Promise<Address[]> {
    const contract = await this.contract;
    return contract.read.assetsTokensAddresses(overrides);
  }
}
