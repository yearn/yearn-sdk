import { defaultAbiCoder, ParamType } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";

import { ChainId } from "../chain";
import { ContractAddressId, ContractService, WrappedContract } from "../common";
import { Address } from "../types";

type DecodingType = string | BigNumber;

/**
 * [[PropertiesAggregatorService]] allows queries of a contract's methods to be aggregated into one
 * call, with the limitation that none of the methods can have arguments. Method names are dynamically provided
 * in order to provide flexibility for easily adding or removing property queries in the future
 */
export class PropertiesAggregatorService<T extends ChainId> extends ContractService<T> {
  static abi = [
    "function getProperty(address target, string calldata name) public view returns (bytes memory)",
    "function getProperties(address target, string[] calldata names) public view returns (bytes[] memory)",
  ];
  static contractId = ContractAddressId.propertiesAggregator;

  get contract(): Promise<WrappedContract> {
    return this._getContract(PropertiesAggregatorService.abi, PropertiesAggregatorService.contractId, this.ctx);
  }

  /**
   * Fetches a single property from the target contract, assuming no arguments are used for the property
   * @param target The target contract to perform the call on
   * @param paramType Ethers' `ParamType` object that contains data about the method to call e.g. ParamType.from("string name")
   * @returns The decoded result of the property query
   */
  async getProperty(target: Address, paramType: ParamType): Promise<DecodingType> {
    const contract = await this.contract;
    const data = await contract.read.getProperty(target, paramType.name);
    const decoded = defaultAbiCoder.decode([paramType.type], data)[0];

    return Promise.resolve(decoded);
  }

  /**
   * Simultaneously fetches multiple properties from the target contract, assuming no arguments are used for each property
   * @param target The target contract to perform the call on
   * @param paramTypes An array of Ethers' `ParamType` object that contains data about the method to call e.g. ParamType.from("string name")
   * @returns An object with the inputted property names as keys, and corresponding decoded data as values
   */
  async getProperties(target: Address, paramTypes: ParamType[]): Promise<Record<string, DecodingType>> {
    const contract = await this.contract;
    const names = paramTypes.map((param) => param.name);
    const data = await contract.read.getProperties(target, names);

    const result: Record<string, DecodingType> = {};
    paramTypes.forEach((paramType, index) => {
      const datum = data[index];
      const decoded = defaultAbiCoder.decode([paramType.type], datum)[0];
      result[paramType.name] = decoded;
    });
    return Promise.resolve(result);
  }
}
