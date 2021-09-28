import { CallOverrides } from "@ethersproject/contracts";

import { AdapterAbi } from "../../abi";
import { ChainId } from "../../chain";
import { ContractService } from "../../common";
import { Context } from "../../context";
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

  constructor(chainId: T, ctx: Context) {
    super(ctx.addresses.adapters.registryV2 ?? RegistryV2Adapter.addressByChain(chainId), chainId, ctx);
  }

  /**
   * Get most up-to-date address of the Vault V2 adapter contract for a
   * particular chain id.
   * @param chainId
   * @returns address
   */
  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0x240315db938d44bb124ae619f5fd0269a02d1271";
      case 250:
        return "0xa9B4C00Fd62BeC69d5DC9102d8d3DDCD9A532C48";
    }
  }

  /**
   * Get the static part of Vault assets.
   * @param addresses filter, if not provided all assets are returned
   * @param overrides
   * @returns static
   */
  async assetsStatic(addresses?: Address[], overrides: CallOverrides = {}): Promise<VaultStatic[]> {
    if (addresses) {
      return await this.contract.read["assetsStatic(address[])"](addresses, overrides).then(structArray);
    }
    return await this.contract.read["assetsStatic()"]().then(structArray);
  }

  /**
   * Get the dynamic part of Vault assets.
   * @param addresses filter, if not provided all assets are returned
   * @param overrides
   * @returns dynamic
   */
  async assetsDynamic(addresses?: Address[], overrides: CallOverrides = {}): Promise<VaultDynamic[]> {
    if (addresses) {
      return await this.contract.read["assetsDynamic(address[])"](addresses, overrides)
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
    return await this.contract.read["assetsDynamic()"]()
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
    if (addresses) {
      return await this.contract.read["assetsPositionsOf(address,address[])"](address, addresses, overrides).then(
        structArray
      );
    }
    return await this.contract.read["assetsPositionsOf(address)"](address, overrides).then(structArray);
  }

  /**
   * Get all Vault underlying token addresses.
   * @param overrides
   * @returns
   */
  async tokens(overrides: CallOverrides = {}): Promise<Address[]> {
    return await this.contract.read.assetsTokensAddresses(overrides);
  }
}
