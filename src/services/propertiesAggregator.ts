import { AbiCoder, ParamType } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";

import { ChainId } from "../chain";
import { ContractAddressId, ContractService, WrappedContract } from "../common";
import { Address } from "../types";

type DecodingType = string | BigNumber;

type PropertyAggregatorArgs = {
  target: Address;
  paramType: ParamType;
};

export class PropertiesAggregatorService<T extends ChainId> extends ContractService<T> {
  static abi = [
    "function getProperty(address target, string calldata name) public view returns (bytes memory)",
    "function getProperties(address target, string[] calldata names) public view returns (bytes[] memory)",
  ];
  static contractId = ContractAddressId.propertiesAggregator;

  private coder = new AbiCoder();

  get contract(): Promise<WrappedContract> {
    return this._getContract(PropertiesAggregatorService.abi, PropertiesAggregatorService.contractId, this.ctx);
  }

  async getProperty({ target, paramType }: PropertyAggregatorArgs): Promise<string> {
    const contract = await this.contract;
    const data = await contract.read.getProperty(target, paramType.name);
    const decoded = this.coder.decode([paramType.type], data)[0];

    return Promise.resolve(decoded);
  }

  async getProperties(target: Address, paramTypes: ParamType[]): Promise<Record<string, DecodingType>> {
    const contract = await this.contract;
    const names = paramTypes.map((param) => param.name);
    const data = await contract.read.getProperties(target, names);

    const result: Record<string, DecodingType> = {};
    paramTypes.forEach((paramType, index) => {
      const datum = data[index];
      const decoded = this.coder.decode([paramType.type], datum)[0];
      result[paramType.name] = decoded;
    });
    return Promise.resolve(result);
  }
}
