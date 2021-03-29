import { Provider } from "@ethersproject/providers";

import { Asset, Position } from "../asset";
import { Address, ContractProvider } from "../common";
import { ChainId, EthMain } from "../chain";
import { structArray } from "../struct";
import { IRegistryAdapter, RegistryV2Adapter } from "./adapters/registry";

export const LensAbi = [
  "function getRegistries() external view returns (address[] memory)",
  "function getAssets() external view returns (tuple(string name, address id, string version)[] memory)",
  "function getAssetsFromAdapter(address) external view returns (tuple(string name, address id, string version)[] memory)",
  "function getPositionsOf(address) external view returns (tuple(address asset, uint256 depositedBalance, uint256 tokenBalance, uint256 tokenAllowance)[] memory)",
  "function getPositionsOf(address, address) external view returns (tuple(address asset, uint256 depositedBalance, uint256 tokenBalance, uint256 tokenAllowance)[] memory)"
];

export type Adapters<T extends ChainId> = T extends EthMain
  ? {
      vaults: {
        v1: IRegistryAdapter;
        v2: RegistryV2Adapter;
      };
    }
  : {
      vaults: {
        v2: RegistryV2Adapter;
      };
    };

/**
 * Lens module provides access to all yearn's assets and user positions.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */
export class LensProvider<T extends ChainId> extends ContractProvider {
  static abi = LensAbi;

  constructor(chainId: T, provider: Provider) {
    super(LensProvider.addressByChain(chainId), chainId, provider);
  }

  get adapters(): Adapters<T> {
    switch (this.chainId) {
      case 1:
        throw new Error();
      case 250: // FTM
        return {
          vaults: {
            v2: new RegistryV2Adapter(
              "0x437758D475F70249e03EDa6bE23684aD1FC375F0",
              this.chainId,
              this.provider
            )
          }
        } as Adapters<T>;
    }
    throw new TypeError(`No adapter exist for chainId ${this.chainId}`);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 250:
        return "0xFa58130BE296EDFA23C42a1d15549fA91449F979";
    }
    throw new TypeError(`Lens does not have an address for chainId ${chainId}`);
  }

  async getRegistries(): Promise<string[]> {
    return await this.contract.getRegistries();
  }

  async getAssets(): Promise<Asset[]> {
    return await this.contract.getAssets().then(structArray);
  }

  async getAssetsFromAdapter(adapter: Address): Promise<Asset[]> {
    return await this.contract.getAssetsFromAdapter(adapter).then(structArray);
  }

  async getPositions(address: string): Promise<Position[]> {
    return await this.contract.getPositionsOf(address).then(structArray);
  }
}
