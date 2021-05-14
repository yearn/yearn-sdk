import { TokenAbi } from "../abi";
import { ChainId } from "../chain";
import { ContractService } from "../common";
import { Context } from "../context";
import { structArray } from "../struct";

import { Address, ERC20 } from "../types";

const HelperAbi = [`function tokensMetadata(address[] memory) public view returns (${TokenAbi}[] memory)`];

export class HelperService<T extends ChainId> extends ContractService {
  static abi = HelperAbi;

  constructor(chainId: T, ctx: Context) {
    super(ctx.addresses.helper ?? HelperService.addressByChain(chainId), chainId, ctx);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1: // FIXME: doesn't actually exist
      case 250: // ditto
      case 1337: // ditto
        return "0x420b1099B9eF5baba6D92029594eF45E19A04A4A";
    }
  }

  async tokens(addresses: Address[]): Promise<ERC20[]> {
    return await this.contract.read.tokensMetadata(addresses).then(structArray);
  }
}
