import { BigNumber } from "@ethersproject/bignumber";

import { Address, Addressable } from "../common";
import { ChainId } from "../chain";
import { structArray } from "../struct";

export interface Asset {
  name: string;
  id: Address;
  version: string;
}

export interface Position {
  asset: Address;
  depositedBalance: BigNumber;
  tokenBalance: BigNumber;
  tokenAllowance: BigNumber;
}

const LensAbi = [
  "function getRegistries() external view returns (address[] memory)",
  "function getAssets() external view returns (tuple(string name, address id, string version)[] memory)",
  "function getAssetsFromAdapter(address) external view returns (tuple(string name, address id, string version)[] memory)",
  "function getPositionsOf(address) external view returns (tuple(address asset, uint256 depositedBalance, uint256 tokenBalance, uint256 tokenAllowance)[] memory)"
];

/**
 * Lens module provides access to all yearn's assets and user positions.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */
export class Lens extends Addressable {
  static abi = LensAbi;

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
