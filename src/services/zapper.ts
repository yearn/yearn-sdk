import { getAddress } from "@ethersproject/address";

import { Chains } from "../chain";
import { Service } from "../common";
import { EthAddress, handleHttpError, usdc, ZeroAddress } from "../helpers";
import { Address, Balance, BalancesMap, Integer, Token, ZapperToken } from "../types";
import {
  GasPrice,
  ZapApprovalStateOutput,
  ZapApprovalTransactionOutput,
  ZapOutput,
  ZapProtocol
} from "../types/custom/zapper";

const ZAPPER_AFFILIATE_ADDRESS = "0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52";

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

    const validTokens: ZapperToken[] = tokens.filter(({ hide, ...importantAttributes }: ZapperToken) =>
      Object.values(importantAttributes).every(attr => !!attr)
    );

    return validTokens.map(
      (token: ZapperToken): Token => {
        const address = token.address === ZeroAddress ? EthAddress : getAddress(token.address);
        const isSupported = !token.hide;

        return {
          address: address,
          name: token.symbol,
          symbol: token.symbol,
          icon: `https://assets.yearn.network/tokens/${network}/${token.address}.png`,
          decimals: token.decimals,
          priceUsdc: usdc(token.price),
          supported: { zapper: isSupported }
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
   * @param zapProtocol the protocol to use with zapper e.g. Yearn, Pickle
   */
  async zapInApprovalState(
    from: Address,
    token: Address,
    zapProtocol: ZapProtocol = ZapProtocol.YEARN
  ): Promise<ZapApprovalStateOutput> {
    const url = `https://api.zapper.fi/v1/zap-in/vault/${zapProtocol}/approval-state`;
    const params = new URLSearchParams({
      ownerAddress: from,
      sellTokenAddress: token,
      api_key: this.ctx.zapper
    });
    const response: ZapApprovalStateOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }

  /**
   * Fetches the data needed to approve ZapIn Contract for a token
   * @param from - the address that is depositing
   * @param token - the token to be sold to pay for the deposit
   * @param gasPrice
   * @param zapProtocol the protocol to use with zapper e.g. Yearn, Pickle
   */
  async zapInApprovalTransaction(
    from: Address,
    token: Address,
    gasPrice: Integer,
    zapProtocol: ZapProtocol = ZapProtocol.YEARN
  ): Promise<ZapApprovalTransactionOutput> {
    const url = `https://api.zapper.fi/v1/zap-in/vault/${zapProtocol}/approval-transaction`;
    const params = new URLSearchParams({
      gasPrice,
      ownerAddress: from,
      sellTokenAddress: token,
      api_key: this.ctx.zapper
    });
    const response: ZapApprovalTransactionOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }

  /**
   * Fetches the data needed to check token ZapOut contract approval state
   * @param from - the address that is withdrawing
   * @param token - the vault token to be withdrawn
   * @param zapProtocol the protocol to use with zapper e.g. Yearn, Pickle
   */
  async zapOutApprovalState(
    from: Address,
    token: Address,
    zapProtocol: ZapProtocol = ZapProtocol.YEARN
  ): Promise<ZapApprovalStateOutput> {
    const url = `https://api.zapper.fi/v1/zap-out/vault/${zapProtocol}/approval-state`;
    const params = new URLSearchParams({
      ownerAddress: from,
      sellTokenAddress: token,
      api_key: this.ctx.zapper
    });
    const response: ZapApprovalStateOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }

  /**
   * Fetches the data needed to approve ZapOut Contract for a token
   * @param from - the address that is withdrawing
   * @param token - the vault token to be withdrawn
   * @param gasPrice
   * @param zapProtocol the protocol to use with zapper e.g. Yearn, Pickle
   */
  async zapOutApprovalTransaction(
    from: Address,
    token: Address,
    gasPrice: Integer,
    zapProtocol: ZapProtocol = ZapProtocol.YEARN
  ): Promise<ZapApprovalTransactionOutput> {
    const url = `https://api.zapper.fi/v1/zap-out/vault/${zapProtocol}/approval-transaction`;
    const params = new URLSearchParams({
      gasPrice,
      ownerAddress: from,
      sellTokenAddress: token,
      api_key: this.ctx.zapper
    });
    const response: ZapApprovalTransactionOutput = await fetch(`${url}?${params}`)
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
   * @param skipGasEstimate - provide the gasLimit in the response. Should be set to true when simulating a zap without approval
   * @param zapProtocol the protocol to use with zapper e.g. Yearn, Pickle
   */
  async zapIn(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    gasPrice: Integer,
    slippagePercentage: number,
    skipGasEstimate: boolean,
    zapProtocol: ZapProtocol = ZapProtocol.YEARN
  ): Promise<ZapOutput> {
    let sellToken = token;
    if (EthAddress === token) {
      // If Ether is being sent, the sellTokenAddress should be the zero address
      sellToken = ZeroAddress;
    }

    const url = `https://api.zapper.fi/v1/zap-in/vault/${zapProtocol}/transaction`;
    const params = new URLSearchParams({
      affiliateAddress: ZAPPER_AFFILIATE_ADDRESS,
      ownerAddress: from,
      sellTokenAddress: sellToken,
      sellAmount: amount,
      poolAddress: vault,
      gasPrice: gasPrice,
      slippagePercentage: slippagePercentage.toString(),
      api_key: this.ctx.zapper,
      skipGasEstimate: skipGasEstimate ? "true" : "false"
    });

    const response: ZapOutput = await fetch(`${url}?${params}`)
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
   * @param skipGasEstimate - provide the gasLimit in the response. Should be set to true when simulating a zap without approval
   * @param zapProtocol the protocol to use with zapper e.g. Yearn, Pickle
   * @param signature - the account valid secp256k1 signature of Permit encoded from r, s, v. (https://eips.ethereum.org/EIPS/eip-2612)
   */
  async zapOut(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    gasPrice: Integer,
    slippagePercentage: number,
    skipGasEstimate: boolean,
    zapProtocol: ZapProtocol = ZapProtocol.YEARN,
    signature?: string
  ): Promise<ZapOutput> {
    let toToken = token;
    if (EthAddress === token) {
      // If Ether is being received, the toTokenAddress should be the zero address
      toToken = ZeroAddress;
    }

    const url = `https://api.zapper.fi/v1/zap-out/vault/${zapProtocol}/transaction`;
    const params = new URLSearchParams({
      affiliateAddress: ZAPPER_AFFILIATE_ADDRESS,
      ownerAddress: from,
      toTokenAddress: toToken,
      sellAmount: amount,
      poolAddress: vault,
      gasPrice: gasPrice,
      slippagePercentage: slippagePercentage.toString(),
      api_key: this.ctx.zapper,
      shouldSellEntireBalance: "true",
      skipGasEstimate: skipGasEstimate ? "true" : "false",
      ...(signature && { signature })
    });
    const response: ZapOutput = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then(res => res.json());

    return response;
  }
}
