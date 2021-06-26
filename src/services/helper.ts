import { CallOverrides } from "@ethersproject/contracts";

import { AllowanceAbi, TokenAbi, TokenBalanceAbi, TokenPriceAbi } from "../abi";
import { ChainId } from "../chain";
import { ContractService } from "../common";
import { Context } from "../context";
import { structArray } from "../struct";
import { Address, ERC20, TokenAlias, TokenAllowance, TokenBalance, TokenPrice } from "../types";

const HelperAbi = [
  `function tokensMetadata(address[] memory) public view returns (${TokenAbi}[] memory)`,
  `function tokensPrices(address[] memory) public view returns (${TokenPriceAbi}[] memory)`,
  `function tokensBalances(address, address[] memory) public view returns (${TokenBalanceAbi}[] memory)`,
  `function allowances(address, address[] memory, address[] memory) external view returns (${AllowanceAbi}[] memory)`
];

/**
 * [[HelperService]] is a generalized containers for all the utilities that are
 * used in the lens codebase and in the SDK.
 */
export class HelperService<T extends ChainId> extends ContractService<T> {
  static abi = HelperAbi;

  constructor(chainId: T, ctx: Context) {
    super(ctx.addresses.helper ?? HelperService.addressByChain(chainId), chainId, ctx);
  }

  /**
   * Get most up-to-date address of the Helper contract for a particular chain
   * id.
   * @param chainId
   * @returns address
   */
  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
      case 250: // FIXME: doesn't actually exist
        return "0x5AACD0D03096039aC4381CD814637e9FB7C34a6f";
    }
  }

  /**
   * Get a list of [[ERC20]] objects for a list of token addresses.
   * @param addresses
   * @param overrides
   * @returns list of erc20 object
   */
  async tokens(addresses: Address[], overrides: CallOverrides = {}): Promise<ERC20[]> {
    return await this.contract.read.tokensMetadata(addresses, overrides).then(structArray);
  }

  /**
   * Get a list of token prices for a list of token addresses.
   * @param addresses
   * @param overrides
   * @returns list of token prices
   */
  async tokenPrices(addresses: Address[], overrides: CallOverrides = {}): Promise<TokenPrice[]> {
    return await this.contract.read.tokensPrices(addresses, overrides).then(structArray);
  }

  /**
   * Get a list of token balances from a list of token addresses for a
   * particular address.
   * @param address
   * @param tokens
   * @param overrides
   * @returns list of token balances
   */
  async tokenBalances(address: Address, tokens: Address[], overrides: CallOverrides = {}): Promise<TokenBalance[]> {
    return await this.contract.read.tokensBalances(address, tokens, overrides).then(structArray);
  }

  /**
   * Get a list of token allowances for a list of token addresses and spenders
   * for a particular address.
   * @param address
   * @param tokens
   * @param spenders
   * @param overrides
   * @returns
   */
  async tokenAllowances(
    address: Address,
    tokens: Address[],
    spenders: Address[],
    overrides: CallOverrides = {}
  ): Promise<TokenAllowance[]> {
    return await this.contract.read.allowance(address, tokens, spenders, overrides).then(structArray);
  }

  async tokenAliases(addresses: Address[]): Promise<Map<Address, TokenAlias>> {
    interface AliasResponse extends TokenAlias {
      address: Address;
    }

    const map = new Map<Address, TokenAlias>();
    const aliases: AliasResponse[] = await fetch(
      "https://raw.githubusercontent.com/yearn/yearn-assets/master/icons/aliases.json"
    ).then(response => response.json());

    aliases
      .filter(alias => addresses.includes(alias.address))
      .forEach(alias => map.set(alias.address, { name: alias.name, symbol: alias.symbol }));

    return map;
  }

  tokenIconUrl(address: Address): String {
    return `https://raw.githubusercontent.com/iearn-finance/yearn-assets/master/icons/tokens/${address}/logo-128.png`;
  }
}
