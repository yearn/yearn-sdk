import { CallOverrides } from "@ethersproject/contracts";

import { AllowanceAbi, TokenAbi, TokenBalanceAbi, TokenPriceAbi } from "../abi";
import { ChainId } from "../chain";
import { ContractAddressId, ContractService } from "../common";
import { chunkArray } from "../helpers";
import { structArray } from "../struct";
import { Address, ERC20, TokenAllowance, TokenBalance, TokenPrice } from "../types";

const HelperAbi = [
  `function tokensMetadata(address[] memory) public view returns (${TokenAbi}[] memory)`,
  `function tokensPrices(address[] memory) public view returns (${TokenPriceAbi}[] memory)`,
  `function tokensBalances(address, address[] memory) public view returns (${TokenBalanceAbi}[] memory)`,
  `function allowances(address, address[] memory, address[] memory) external view returns (${AllowanceAbi}[] memory)`,
  "function assetStrategiesAddresses(address) public view returns (address[])"
];

/**
 * [[HelperService]] is a generalized containers for all the utilities that are
 * used in the lens codebase and in the SDK.
 */
export class HelperService<T extends ChainId> extends ContractService<T> {
  static abi = HelperAbi;
  static contractId = ContractAddressId.helper;

  get contract() {
    return super._getContract(HelperService.abi, HelperService.contractId, this.ctx);
  }

  /**
   * Get a list of [[ERC20]] objects for a list of token addresses.
   * @param addresses
   * @param overrides
   * @returns list of erc20 object
   */
  async tokens(addresses: Address[], overrides: CallOverrides = {}): Promise<ERC20[]> {
    return await this.contract.then(contract => contract.read.tokensMetadata(addresses, overrides)).then(structArray);
  }

  /**
   * Get a list of token prices for a list of token addresses.
   * @param addresses
   * @param overrides
   * @returns list of token prices
   */
  async tokenPrices(addresses: Address[], overrides: CallOverrides = {}): Promise<TokenPrice[]> {
    return await this.contract.then(contract => contract.read.tokensPrices(addresses, overrides)).then(structArray);
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
    const chunks = chunkArray(tokens, 30);
    const promises = chunks.map(async chunk =>
      this.contract.then(contract => contract.read.tokensBalances(address, chunk, overrides)).then(structArray)
    );
    return Promise.all(promises).then(chunks => chunks.flat());
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
    return await this.contract
      .then(contract => contract.read.allowances(address, tokens, spenders, overrides))
      .then(structArray);
  }

  async assetStrategiesAddresses(address: Address, overrides: CallOverrides = {}): Promise<Address[]> {
    return this.contract.then(contract => contract.read.assetStrategiesAddresses(address, overrides));
  }
}
