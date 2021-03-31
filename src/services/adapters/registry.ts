import { Position, SpecificAsset, Token } from "../../assets";
import { Address, ContractService } from "../../common";
import { structArray } from "../../struct";

export interface IRegistryAdapter {
  tokens(): Promise<Token[]>;
  assets(): Promise<(SpecificAsset<"VAULT_V1"> | SpecificAsset<"VAULT_V2">)[]>;
  positionsOf(address: Address): Promise<Position[]>;
}

export const RegistryV2AdapterAbi = [
  "function tokens() public view returns (tuple(address id, string name, string symbol, uint8 decimals)[] memory)",
  `function assets() public view returns (\
    tuple(address id, string typeId, string name, string version, uint256 balance, uint256 balanceUsd, \
      tuple(address id, string name, string symbol, uint256 decimals) token, \
      tuple(string symbol, uint256 pricePerShare, bool migrationAvailable, address latestVaultAddress, uint256 depositLimit, bool emergencyShutdown) metadata)[] memory \
    )`,
  `function positionsOf(address) public view returns (\
    tuple(address assetId, uint256 balance, uint256 balanceUsdc, \
      tuple(address tokenId, uint256 balance, uint256 balanceUsdc, tuple(address owner, address spender, uint256 allowance)[] allowances) tokenPosition)[] memory \
    )`
];

export class RegistryV2Adapter extends ContractService
  implements IRegistryAdapter {
  static abi = RegistryV2AdapterAbi;

  async tokens(): Promise<Token[]> {
    return this.contract.tokens().then(structArray);
  }

  async assets(): Promise<SpecificAsset<"VAULT_V2">[]> {
    return await this.contract.assets().then(structArray);
  }

  async positionsOf(address: Address): Promise<Position[]> {
    return await this.contract.positionsOf(address).then(structArray);
  }
}
