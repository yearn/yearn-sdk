import { ChainId } from "../../chain";
import { Address, ContractService } from "../../common";
import { Context } from "../../context";
import { structArray } from "../../struct";

import { Position, VaultStatic, VaultDynamic, VaultV2Static, VaultV2Dynamic, ERC20 } from "../../types";

export interface IRegistryAdapter {
  assetsStatic(): Promise<VaultStatic[]>;
  assetsDynamic(): Promise<VaultDynamic[]>;
  positionsOf(address: Address, addresses?: Address[]): Promise<Position[]>;
  tokens(): Promise<ERC20[]>;
}

const VaultV2StaticAbi =
  "tuple(address address, string typeId, string name, string version," +
  "tuple(address address, string name, string symbol, uint256 decimals) token)";

const VaultV2DynamicAbi =
  "tuple(address address, string typeId, address tokenId," +
  "tuple(uint256 amount, uint256 amountUsdc) underlyingTokenBalance," +
  "tuple(string symbol, uint256 pricePerShare, bool migrationAvailable, address latestVaultAddress, uint256 depositLimit, bool emergencyShutdown) metadata)";

const PositionAbi =
  "tuple(address assetId, address tokenId, string typeId, uint256 balance," +
  "tuple(uint256 amount, uint256 amountUsdc) underlyingTokenBalance," +
  "tuple(address owner, address spender, uint256 amount)[] tokenAllowances," +
  "tuple(address owner, address spender, uint256 amount)[] assetAllowances)";

const TokenAbi = "tuple(address address, string name, string symbol, uint256 decimals)";

export const RegistryV2AdapterAbi = [
  "function assetsStatic() public view returns (" + VaultV2StaticAbi + "[] memory)",
  "function assetsStatic(address[] memory) public view returns (" + VaultV2StaticAbi + "[] memory)",
  "function assetsDynamic() public view returns (" + VaultV2DynamicAbi + "[] memory)",
  "function assetsDynamic(address[] memory) public view returns (" + VaultV2DynamicAbi + "[] memory)",
  "function assetsPositionsOf(address) public view returns (" + PositionAbi + "[] memory)",
  "function assetsPositionsOf(address, address[] memory) public view returns (" + PositionAbi + "[] memory)",
  "function tokens() public view returns (" + TokenAbi + "[] memory)"
];

export class RegistryV2Adapter<T extends ChainId> extends ContractService implements IRegistryAdapter {
  static abi = RegistryV2AdapterAbi;

  constructor(chainId: T, ctx: Context) {
    super(ctx.address("registryV2Adapter") ?? RegistryV2Adapter.addressByChain(chainId), chainId, ctx);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0x21670dDB429B6D80B5bE4e65532576bB14b7cC62";
      case 250: // FIXME: doesn't actually exist
        return "0x21670dDB429B6D80B5bE4e65532576bB14b7cC62";
    }
  }

  async assetsStatic(addresses?: Address[]): Promise<VaultV2Static[]> {
    if (addresses) {
      return await this.contract["assetsStatic(address[])"](addresses).then(structArray);
    }
    return await this.contract["assetsStatic()"]().then(structArray);
  }

  async assetsDynamic(addresses?: Address[]): Promise<VaultV2Dynamic[]> {
    if (addresses) {
      return await this.contract["assetsDynamic(address[])"](addresses).then(structArray);
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
