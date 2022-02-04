import { AddressMetadataAbi } from "../abi";
import { ChainId } from "../chain";
import { ContractService } from "../common";
import { Context } from "../context";

/**
 * [[AddressProviderService]] fetches addresses of various contracts based on the
 * network and feeds them to the Yearn SDK
 */
export class AddressProviderService<T extends ChainId> extends ContractService<T> {
  ready: Promise<void>;
  static abi = [
    "function addressById(string) public view returns (address)",
    "function addressPositionById(string) public view returns (int256)",
    "function addresses() public view returns (address[] memory)",
    "function addressesIds() public view returns (string[] memory)",
    `function addressesMetadata() public view returns (${AddressMetadataAbi}[] memory)`,
    `function addressesMetadataByIdStartsWith(string) public view returns (${AddressMetadataAbi}[] memory)`
  ];

  constructor(chainId: T, ctx: Context) {
    super(AddressProviderService.addressByChain(chainId), chainId, ctx);
    this.ready = this.initialize();
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0x9be19ee7bc4099d62737a7255f5c227fbcd6db93";
      case 250:
        return "0xac5A9E4135A3A26497F3890bFb602b06Ee592B61";
      case 42161:
        return "0xcad10033c86b0c1ed6bfccaa2ff6779938558e9f";
    }
  }

  private async initialize(): Promise<void> {
    const addresses: [string, string][] = await this.contract.read.addressesMetadata();

    const addressByKey = (key: string): string | undefined => {
      let tuple = addresses.find(tuple => tuple.includes(key));
      if (!tuple) return;
      return tuple[1];
    };

    this.ctx.addresses = {
      oracle: addressByKey("ORACLE"),
      helper: addressByKey("HELPER"),
      adapters: {}
    };
    return Promise.resolve();
  }
}
