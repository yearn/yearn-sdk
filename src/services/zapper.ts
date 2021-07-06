import { getAddress } from "@ethersproject/address";

import { Chains } from "../chain";
import { Service } from "../common";
import { EthAddress, handleHttpError, usdc, ZeroAddress } from "../helpers";
import { Address, Balance, BalancesMap, Integer, Token } from "../types";
import {
  GasPrice,
  ZapInApprovalStateOutput,
  ZapInApprovalTransactionOutput,
  ZapInOutput,
  ZapOutApprovalStateOutput,
  ZapOutApprovalTransactionOutput,
  ZapOutOutput
} from "../types/custom/zapper";

/**
 * [[ZapperService]] interacts with the zapper api to gather more insight for
 * tokens and user positions.
 */
export class ZapperService extends Service {
  /**
   * Fetch all the tokens supported by the zapper protocol along with some basic
   * metadata.
   * @returns list of tokens supported by the zapper protocol.
   */
  async supportedTokens(): Promise<Token[]> {
    const url = "https://api.zapper.fi/v1/prices";
    const params = new URLSearchParams({ api_key: this.ctx.zapper });
    const tokens = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());
    const network = Chains[this.chainId] ?? "ethereum";
    return tokens.map(
      (token: Record<string, string>): Token => {
        const address = token.address === ZeroAddress ? EthAddress : getAddress(String(token.address));
        return {
          address: address,
          name: token.symbol,
          symbol: token.symbol,
          icon: `https://zapper.fi/images/networks/${network}/${token.address}.png`,
          decimals: token.decimals,
          priceUsdc: usdc(token.price),
          supported: { zapper: true }
        };
      }
    );
  }

  /**
   * Fetch token balances from the {@link ZapperService.supportedTokens} list
   * for a particular address.
   * @param address
   */
  async balances<T extends Address>(address: T): Promise<Balance[]>;

  /**
   * Fetch token balances from the {@link ZapperService.supportedTokens} list
   * for a list of addresses.
   * @param addresses
   */
  async balances<T extends Address>(addresses: T[]): Promise<BalancesMap<T>>;
  async balances<T extends Address>(addresses: T[] | T): Promise<BalancesMap<T> | Balance[]>;

  async balances<T extends Address>(addresses: T[] | T): Promise<BalancesMap<T> | Balance[]> {
    const url = "https://api.zapper.fi/v1/protocols/tokens/balances";
    const params = new URLSearchParams({
      "addresses[]": Array.isArray(addresses) ? addresses.join() : addresses,
      api_key: this.ctx.zapper
    });
    const balances = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());
    Object.keys(balances).forEach(address => {
      const copy = balances[address];
      delete balances[address];
      if (copy.products.length === 0) {
        balances[getAddress(address)] = [];
      } else {
        const assets = copy.products[0].assets;
        balances[getAddress(address)] = assets.map(
          (balance: Record<string, string>): Balance => {
            const address = balance.address === ZeroAddress ? EthAddress : getAddress(String(balance.address));
            return {
              address,
              token: {
                address,
                name: balance.symbol,
                symbol: balance.symbol,
                decimals: balance.decimals
              },
              balance: balance.balanceRaw,
              balanceUsdc: usdc(balance.balanceUSD),
              priceUsdc: usdc(balance.price)
            };
          }
        );
      }
    });
    if (!Array.isArray(addresses)) return balances[addresses];
    return balances;
  }

  /**
   * Fetch up to date gas prices in gwei
   * @returns gas prices
   */
  async gas(): Promise<GasPrice> {
    const url = "https://api.zapper.fi/v1/gas-price";
    const params = new URLSearchParams({
      api_key: this.ctx.zapper
    });
    const gas = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());
    return gas;
  }

  /**
   * Fetches the data needed to check token ZapIn contract approval state
   * @param from - the address that is depositing
   * @param token - the token to be sold to pay for the deposit
   */
  async zapInApprovalState(from: Address, token: Address): Promise<ZapInApprovalStateOutput> {
    const url = "https://api.zapper.fi/v1/zap-in/yearn/approval-state";
    const params = new URLSearchParams({
      ownerAddress: from,
      sellTokenAddress: token,
      api_key: this.ctx.zapper
    });
    const response: ZapInApprovalStateOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }

  /**
   * Fetches the data needed to approve ZapIn Contract for a token
   * @param from - the address that is depositing
   * @param token - the token to be sold to pay for the deposit
   * @param gasPrice
   */
  async zapInApprovalTransaction(
    from: Address,
    token: Address,
    gasPrice: Integer
  ): Promise<ZapInApprovalTransactionOutput> {
    const url = "https://api.zapper.fi/v1/zap-in/yearn/approval-transaction";
    const params = new URLSearchParams({
      gasPrice,
      ownerAddress: from,
      sellTokenAddress: token,
      api_key: this.ctx.zapper
    });
    const response: ZapInApprovalTransactionOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }

  /**
   * Fetches the data needed to check token ZapOut contract approval state
   * @param from - the address that is withdrawing
   * @param token - the vault token to be withdrawn
   */
  async zapOutApprovalState(from: Address, token: Address): Promise<ZapOutApprovalStateOutput> {
    const url = "https://api.zapper.fi/v1/zap-out/yearn/approval-state";
    const params = new URLSearchParams({
      ownerAddress: from,
      sellTokenAddress: token,
      api_key: this.ctx.zapper
    });
    const response: ZapOutApprovalStateOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }

  /**
   * Fetches the data needed to approve ZapOut Contract for a token
   * @param from - the address that is withdrawing
   * @param token - the vault token to be withdrawn
   * @param gasPrice
   */
  async zapOutApprovalTransaction(
    from: Address,
    token: Address,
    gasPrice: Integer
  ): Promise<ZapInApprovalTransactionOutput> {
    const url = "https://api.zapper.fi/v1/zap-out/yearn/approval-transaction";
    const params = new URLSearchParams({
      gasPrice,
      ownerAddress: from,
      sellTokenAddress: token,
      api_key: this.ctx.zapper
    });
    const response: ZapOutApprovalTransactionOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }

  /**
   * Fetches the data needed to zap into a vault
   * @param from - the address that is depositing
   * @param token - the token to be sold to pay for the deposit
   * @param amount - the amount of tokens to be sold
   * @param vault - the vault to zap into
   * @param gasPrice
   * @param slippagePercentage - slippage as a decimal
   */
  async zapIn(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    gasPrice: Integer,
    slippagePercentage: number
  ): Promise<ZapInOutput> {
    let sellToken = token;
    if (EthAddress === token) {
      // If Ether is being sent, the sellTokenAddress should be the zero address
      sellToken = ZeroAddress;
    }

    const url = "https://api.zapper.fi/v1/zap-in/yearn/transaction";
    const params = new URLSearchParams({
      ownerAddress: from,
      sellTokenAddress: sellToken,
      sellAmount: amount,
      poolAddress: vault,
      gasPrice: gasPrice,
      slippagePercentage: slippagePercentage.toString(),
      api_key: this.ctx.zapper,
      skipGasEstimate: "true"
    });

    const response: ZapInOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }

  /**
   * Fetches the data needed to zap out of a vault
   * @param from - the address that is withdrawing
   * @param token - the token that'll be received
   * @param amount - the amount of tokens to sell
   * @param vault - the vault to zap out of
   * @param gasPrice
   * @param slippagePercentage - slippage as a decimal
   */
  async zapOut(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    gasPrice: Integer,
    slippagePercentage: number
  ): Promise<ZapOutOutput> {
    let toToken = token;
    if (EthAddress === token) {
      // If Ether is being received, the toTokenAddress should be the zero address
      toToken = ZeroAddress;
    }

    const url = "https://api.zapper.fi/v1/zap-out/yearn/transaction";
    const params = new URLSearchParams({
      ownerAddress: from,
      toTokenAddress: toToken,
      sellAmount: amount,
      poolAddress: vault,
      gasPrice: gasPrice,
      slippagePercentage: slippagePercentage.toString(),
      api_key: this.ctx.zapper,
      skipGasEstimate: "true"
    });
    const response: ZapOutOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }

  // async approvalState(owner: Address, sellToken: Address): Promise<ZapApprovalState> {
  //   const url = "https://api.zapper.fi/v1/zap-in/yearn/approval-state";
  //   const params = new URLSearchParams({
  //     sellTokenAddress: sellToken,
  //     ownerAddress: owner,
  //     api_key: this.ctx.zapper
  //   });
  //   const response: ZapApprovalState = await fetch(`${url}?${params}`)
  //     .then(handleHttpError)
  //     .then(res => res.json());

  //   return response;
  // }

  // async approvalTransaction(owner: Address, sellToken: Address): Promise<ZapApprovalTransaction> {
  //   const url = "https://api.zapper.fi/v1/zap-in/yearn/approval-transaction";
  //   const params = new URLSearchParams({
  //     sellTokenAddress: sellToken,
  //     ownerAddress: owner,
  //     gasPrice: "0",
  //     api_key: this.ctx.zapper
  //   });
  //   const response: ZapApprovalTransaction = await fetch(`${url}?${params}`)
  //     .then(handleHttpError)
  //     .then(res => res.json());

  //   return response;
  // }
}
