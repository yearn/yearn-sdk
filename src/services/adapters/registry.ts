import { CallOverrides } from "@ethersproject/contracts";

import { ContractService } from "../../common";
import { ZeroAddress } from "../../helpers";
import { structArray } from "../../struct";
import { Context } from "../../context";
import { AdapterAbi } from "../../abi";
import { ChainId } from "../../chain";
import { Position, VaultStatic, VaultDynamic, Address } from "../../types";

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

export class RegistryV2Adapter<T extends ChainId> extends ContractService implements IRegistryAdapter {
  static abi = AdapterAbi(VaultV2MetadataAbi);

  constructor(chainId: T, ctx: Context) {
    super(ctx.addresses.adapters.registryV2 ?? RegistryV2Adapter.addressByChain(chainId), chainId, ctx);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0x240315db938d44bb124ae619f5fd0269a02d1271";
      case 250: // FIXME: doesn't actually exist
        return "0x240315db938d44bb124ae619f5fd0269a02d1271";
    }
  }

  async assetsStatic(addresses?: Address[], overrides: CallOverrides = {}): Promise<VaultStatic[]> {
    if (addresses) {
      return await this.contract.read["assetsStatic(address[])"](addresses, overrides).then(structArray);
    }
    return await this.contract.read["assetsStatic()"]().then(structArray);
  }

  async assetsDynamic(addresses?: Address[], overrides: CallOverrides = {}): Promise<VaultDynamic[]> {
    if (addresses) {
      return await this.contract.read["assetsDynamic(address[])"](addresses, overrides)
        .then(structArray)
        .then((assets: any) =>
          assets.map((asset: any) => ({
            ...asset,
            metadata: {
              ...assets.metadata,
              controller: ZeroAddress,
              totalAssets: "0",
              totalSupply: "0"
            }
          }))
        );
    }
    return await this.contract.read["assetsDynamic()"]()
      .then(structArray)
      .then((assets: any) =>
        assets.map((asset: any) => ({
          ...asset,
          metadata: {
            ...assets.metadata,
            controller: ZeroAddress,
            totalAssets: "0",
            totalSupply: "0"
          }
        }))
      );
  }

  async positionsOf(address: Address, addresses?: Address[], overrides: CallOverrides = {}): Promise<Position[]> {
    if (addresses) {
      return await this.contract.read["assetsPositionsOf(address,address[])"](address, addresses, overrides).then(
        structArray
      );
    }
    return await this.contract.read["assetsPositionsOf(address)"](address, overrides).then(structArray);
  }

  async tokens(overrides: CallOverrides = {}): Promise<Address[]> {
    return await this.contract.read.assetsTokensAddresses(overrides);
  }
}
