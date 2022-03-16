import { AddressMetadataAbi } from "../abi";
import { ChainId } from "../chain";
import { ContractAddressId, Service, WrappedContract } from "../common";
import { Context } from "../context";
import { structArray } from "../struct";
import { Address } from "../types";

interface AddressMetadata {
  addr: Address;
  addrId: string;
}

/**
 * [[AddressProviderService]] fetches addresses of various contracts based on the
 * network and feeds them to the Yearn SDK.
 */
export class AddressProvider<T extends ChainId> extends Service {
  static abi = [
    "function addressById(string) public view returns (address)",
    "function addressPositionById(string) public view returns (int256)",
    "function addresses() public view returns (address[] memory)",
    "function addressesIds() public view returns (string[] memory)",
    `function addressesMetadata() public view returns (${AddressMetadataAbi}[] memory)`,
    `function addressesMetadataByIdStartsWith(string) public view returns (${AddressMetadataAbi}[] memory)`
  ];
  private contract: WrappedContract;

  constructor(chainId: T, ctx: Context) {
    super(chainId, ctx);
    this.contract = new WrappedContract(AddressProvider.addressByChain(chainId), AddressProvider.abi, ctx);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0xe11dC9f2Ab122dC5978EACA41483Da0D7D7e6128";
      case 250:
        return "0xac5A9E4135A3A26497F3890bFb602b06Ee592B61";
      case 42161:
        return "0xcAd10033C86B0C1ED6bfcCAa2FF6779938558E9f";
      default:
        throw new Error("Unsupported chain id");
    }
  }

  async addressById(id: ContractAddressId): Promise<string> {
    return this.contract.read.addressById(id);
  }

  async addressesMetadataByIdStartsWith(prefix: string): Promise<AddressMetadata[]> {
    return this.contract.read.addressById(prefix).then(structArray);
  }
}
