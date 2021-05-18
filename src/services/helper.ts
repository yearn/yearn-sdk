import { CallOverrides } from "@ethersproject/contracts";
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
      case 1:
      case 1337:
      case 250: // FIXME: doesn't actually exist
        return "0x5AACD0D03096039aC4381CD814637e9FB7C34a6f";
    }
  }

  async tokens(addresses: Address[], overrides: CallOverrides = {}): Promise<ERC20[]> {
    return await this.contract.read.tokensMetadata(addresses, overrides).then(structArray);
  }

  async tokenPrices(addresses: Address[], overrides: CallOverrides = {}): Promise<TokenPrice[]> {
    return await this.contract.read.tokensPrices(addresses, overrides).then(structArray);
  }

  async tokenBalances(address: Address, tokens: Address[], overrides: CallOverrides = {}): Promise<TokenBalance[]> {
    return await this.contract.read.tokensBalances(address, tokens, overrides).then(structArray);
  }

  async tokenAllowances(
    address: Address,
    tokens: Address[],
    spenders: Address[],
    overrides: CallOverrides = {}
  ): Promise<TokenAllowance[]> {
    return await this.contract.read.allowance(address, tokens, spenders, overrides).then(structArray);
  }
}
