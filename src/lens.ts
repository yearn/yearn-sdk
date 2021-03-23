import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";

import { Address } from "./common";

export const LensAddress = "0xFa58130BE296EDFA23C42a1d15549fA91449F979";
export const LensAbi = [
  "function getRegistries() external view returns (address[] memory)",
  "function getAssets() external view returns (tuple(string name, address id, string version)[] memory)",
  "function getPositionsOf(address) external view returns (tuple(address assetId, uint256 depositedBalance, uint256 tokenBalance, uint256 tokenAllowance)[] memory)"
];

export interface Asset {
  name: string;
  id: Address;
  version: string;
}

export interface Position {
  assetId: Address;
  depositedBalance: BigNumber;
  tokenBalance: BigNumber;
  tokenAllowance: BigNumber;
}

export async function getRegistries(provider: Provider): Promise<string[]> {
  const lens = new Contract(LensAddress, LensAbi, provider);
  return await lens.getRegistries();
}

export async function getAssets(provider: Provider): Promise<Asset[]> {
  const lens = new Contract(LensAddress, LensAbi, provider);
  return await lens.getAssets();
}

export async function getPositions(
  address: string,
  provider: Provider
): Promise<Position[]> {
  const lens = new Contract(LensAddress, LensAbi, provider);
  return await lens.getPositionsOf(address);
}
