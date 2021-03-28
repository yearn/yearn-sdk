import { SpecificAsset, Token } from "../../asset";
import { ContractProvider } from "../../common";
import { structArray } from "../../struct";

export interface IRegistryAdapter {
  tokens(): Promise<Token[]>;
  assets(): Promise<(SpecificAsset<"VAULT_V1"> | SpecificAsset<"VAULT_V2">)[]>;
}

export const RegistryV2AdapterAbi = [
  "function tokens() public view returns (tuple(address id, string name, string symbol, uint8 decimals)[] memory)",
  `function assets() public view returns (\
    tuple(address id, string name, string version, uint256 balance, uint256 balanceUsd, \
      tuple(address id, string name, string symbol, uint256 decimals) token, \
      tuple(string symbol, uint256 pricePerShare, bool migrationAvailable, address latestVaultAddress, uint256 depositLimit, bool emergencyShutdown) metadata)[] memory \
    )`
];

export class RegistryV2Adapter extends ContractProvider
  implements IRegistryAdapter {
  static abi = RegistryV2AdapterAbi;

  async tokens(): Promise<Token[]> {
    return this.contract.tokens().then(structArray);
  }

  async assets(): Promise<SpecificAsset<"VAULT_V2">[]> {
    return await this.contract.assets().then(structArray);
  }
}
