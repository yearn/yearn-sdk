import { getAddress } from "@ethersproject/address";
import { TransactionRequest } from "@ethersproject/providers";

import { Chains } from "../chain";
import { Service } from "../common";
import { EthAddress, handleHttpError, SUPPORTED_ZAP_OUT_TOKEN_SYMBOLS, usdc, ZeroAddress } from "../helpers";
import { Address, Balance, Integer, Token, TokenAllowance } from "../types";

const API = "https://api.portals.fi";

export class ZapperService extends Service {
  async supportedTokens(): Promise<Token[]> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/tokens/${network}`;
    const params = new URLSearchParams({
      "platforms[]": ["native", "basic"].join(),
    });
    const { tokens } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return tokens.map((token: any): Token => {
      const address = token.address === ZeroAddress ? EthAddress : getAddress(token.address);
      return {
        address,
        decimals: String(token.decimals),
        icon: `https://assets.yearn.network/tokens/${network}/${token.address.toLowerCase()}.png`,
        name: token.symbol,
        priceUsdc: usdc(token.price),
        dataSource: "portals",
        supported: {
          portalsZapIn: true,
          portalsZapOut: SUPPORTED_ZAP_OUT_TOKEN_SYMBOLS.includes(token.symbol.toUpperCase()), // TODO: add native token for multichain zaps
        },
        symbol: token.symbol,
      };
    });
  }

  async balances<T extends Address>(address: T): Promise<Balance[]> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v2/account`;
    const params = new URLSearchParams({
      ownerAddress: address,
      "networks[]": network,
    });
    const { balances } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return balances.map((balance: any) => {
      const address = balance.address === ZeroAddress ? EthAddress : getAddress(String(balance.address));
      return {
        address,
        token: {
          address,
          name: balance.symbol,
          symbol: balance.symbol,
          decimals: balance.decimals,
        },
        balance: balance.rawBalance,
        balanceUsdc: usdc(balance.balanceUSD),
        priceUsdc: usdc(balance.price),
      };
    });
  }

  async supportedVaultAddresses(): Promise<Address[]> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/tokens/${network}`;
    const params = new URLSearchParams({
      "platforms[]": "yearn",
    });
    const { tokens } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    return tokens.map(({ address }: { address: Address }) => getAddress(address));
  }

  async zapInApprovalState(vault: Address, token: Address, amount: Integer, account: Address): Promise<TokenAllowance> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/approval/${network}`;
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken: token,
      sellAmount: amount,
      buyToken: vault,
    });
    const { context } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    return {
      token,
      owner: account,
      spender: context.target,
      amount: context.allowance,
    };
  }

  async zapInApprovalTransaction(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address
  ): Promise<TransactionRequest> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/approval/${network}`;
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken: token,
      sellAmount: amount,
      buyToken: vault,
    });
    const { tx } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    return tx;
  }

  async zapOutApprovalState(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address
  ): Promise<TokenAllowance> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/approval/${network}`;
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken: vault,
      sellAmount: amount,
      buyToken: token,
    });
    const { context } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    return {
      token: vault,
      owner: account,
      spender: context.target,
      amount: context.allowance,
    };
  }

  async zapOutApprovalTransaction(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address
  ): Promise<TransactionRequest> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/approval/${network}`;
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken: vault,
      sellAmount: amount,
      buyToken: token,
    });
    const { tx } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    return tx;
  }

  async zapIn(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    slippagePercentage: number,
    partnerId: string,
    validate = true
  ): Promise<TransactionRequest> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/portal/${network}`;
    const sellToken = token === EthAddress ? ZeroAddress : token;
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken,
      sellAmount: amount,
      buyToken: vault,
      slippagePercentage: slippagePercentage.toString(),
      partner: partnerId,
      validate: validate ? "true" : "false",
    });
    const { tx } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    return tx;
  }

  async zapOut(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    slippagePercentage: number,
    partnerId: string,
    validate = true
  ): Promise<TransactionRequest> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/portal/${network}`;
    const buyToken = token === EthAddress ? ZeroAddress : token;
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken: vault,
      sellAmount: amount,
      buyToken,
      slippagePercentage: slippagePercentage.toString(),
      partner: partnerId,
      validate: validate ? "true" : "false",
    });
    const { tx } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    return tx;
  }
}
