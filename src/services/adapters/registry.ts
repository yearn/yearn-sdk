import { AdapterAbi } from "../../abi";
import { ChainId } from "../../chain";
import { Address, ContractService } from "../../common";
import { Context } from "../../context";
import { ZeroAddress } from "../../helpers";
import { structArray } from "../../struct";

import { Position, VaultStatic, VaultDynamic, ERC20 } from "../../types";

export interface IRegistryAdapter {
  assetsStatic(): Promise<VaultStatic[]>;
  assetsDynamic(): Promise<VaultDynamic[]>;
  positionsOf(address: Address, addresses?: Address[]): Promise<Position[]>;
  tokens(): Promise<ERC20[]>;
}

const VaultV2MetadataAbi = `tuple(
  string symbol,
  uint256 pricePerShare,
  bool migrationAvailable,
  address latestVaultAddress,
  uint256 depositLimit,
  bool emergencyShutdown
)`;

export class RegistryV2Adapter<T extends ChainId> extends ContractService implements IRegistryAdapter {
  static abi = AdapterAbi(VaultV2MetadataAbi);

  constructor(chainId: T, ctx: Context) {
    super(ctx.address("registryV2Adapter") ?? RegistryV2Adapter.addressByChain(chainId), chainId, ctx);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0xE75E51566C5761896528B4698a88C92A54B3C954";
      case 250: // FIXME: doesn't actually exist
        return "0xE75E51566C5761896528B4698a88C92A54B3C954";
    }
  }

  async assetsStatic(addresses?: Address[]): Promise<VaultStatic[]> {
    if (addresses) {
      return await this.contract["assetsStatic(address[])"](addresses).then(structArray);
    }
    return await this.contract["assetsStatic()"]().then(structArray);
  }

  async assetsDynamic(addresses?: Address[]): Promise<VaultDynamic[]> {
    if (addresses) {
      return await this.contract["assetsDynamic(address[])"](addresses)
        .then(structArray)
        .then((assets: any) => {
          // FIXME: metadata polyfill
          assets.metadata = {
            ...assets.metadata,
            controller: ZeroAddress,
            totalAssets: "0",
            totalSupply: "0"
          };
        });
    }
    return await this.contract["assetsDynamic()"]().then(structArray);
  }

  async positionsOf(address: Address, addresses?: Address[]): Promise<Position[]> {
    if (addresses) {
      return await this.contract["assetsPositionsOf(address,address[])"](address, addresses).then(structArray);
    }
    return await this.contract["assetsPositionsOf(address)"](address).then(structArray);
  }

  async tokens(): Promise<ERC20[]> {
    return await this.contract.tokens().then(structArray);
  }
}
