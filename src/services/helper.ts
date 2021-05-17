import { AllowanceAbi, TokenAbi, TokenBalanceAbi, TokenPriceAbi } from "../abi";
import { ChainId } from "../chain";
import { ContractService } from "../common";
import { Context } from "../context";
import { structArray } from "../struct";

import { Address, ERC20, TokenAllowance, TokenBalance, TokenPrice } from "../types";

const HelperAbi = [
  `function tokensMetadata(address[] memory) public view returns (${TokenAbi}[] memory)`,
  `function tokensPrices(address[] memory) public view returns (${TokenPriceAbi}[] memory)`,
  `function tokensBalances(address, address[] memory) public view returns (${TokenBalanceAbi}[] memory)`,
  `function allowances(address, address[] memory, address[] memory) external view returns (${AllowanceAbi}[] memory)`
];

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

  async tokenPrices(addresses: Address[]): Promise<TokenPrice[]> {
    return await this.contract.read.tokensPrices(addresses).then(structArray);
  }

  async tokenBalances(address: Address, tokens: Address[]): Promise<TokenBalance[]> {
    return await this.contract.read.tokensBalances(address, tokens).then(structArray);
  }

  async tokenAllowances(address: Address, tokens: Address[], spenders: Address[]): Promise<TokenAllowance[]> {
    return await this.contract.read.allowance(address, tokens, spenders).then(structArray);
  }
}
