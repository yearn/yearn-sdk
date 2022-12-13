import { getAddress } from "@ethersproject/address";
import { TransactionRequest } from "@ethersproject/providers";

import { Chains, isEthereum, NETWORK_SETTINGS } from "../chain";
import { Service } from "../common";
import { EthAddress, handleHttpError, usdc, ZeroAddress } from "../helpers";
import { Address, Balance, Integer, Token, TokenAllowance } from "../types";

const API = "https://api.portals.fi";
const YEARN_PARTNER_ADDRESS = "0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52";
const DEFAULT_PLATFORMS = ["native", "basic"];

export class PortalsService extends Service {
  async supportedTokens(): Promise<Token[]> {
    const networkSettings = NETWORK_SETTINGS[this.chainId];
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/tokens/${network}`;
    const params = new URLSearchParams();
    const platforms = [...DEFAULT_PLATFORMS];
    platforms.push("curve");
    platforms.push("beefy");
    if (isEthereum(this.chainId)) platforms.push("convex");
    platforms.forEach((platform) => params.append("platforms[]", platform));
    const { tokens } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return tokens.map((token: any): Token => {
      const address = this.deserializeAddress(token.address);
      let icon = `https://assets.yearn.network/tokens/${network}/${token.address.toLowerCase()}.png`;
      if (!DEFAULT_PLATFORMS.includes(token.platform)) icon = token.image ?? token.images[0] ?? icon;
      return {
        address,
        decimals: String(token.decimals),
        icon,
        name: token.symbol,
        priceUsdc: usdc(token.price),
        dataSource: "portals",
        supported: {
          portalsZapIn: true,
          portalsZapOut: networkSettings.zapOutTokenSymbols?.includes(token.symbol.toUpperCase()),
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
      const address = this.deserializeAddress(balance.address);
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
    const sellToken = this.serializeAddress(token);
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken,
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
    const sellToken = this.serializeAddress(token);
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken,
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
    const buyToken = this.serializeAddress(token);
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken: vault,
      sellAmount: amount,
      buyToken,
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
    const buyToken = this.serializeAddress(token);
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken: vault,
      sellAmount: amount,
      buyToken,
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
    validate = true,
    partnerId?: string
  ): Promise<TransactionRequest> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/portal/${network}`;
    const sellToken = this.serializeAddress(token);
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken,
      sellAmount: amount,
      buyToken: vault,
      slippagePercentage: slippagePercentage.toString(),
      partner: YEARN_PARTNER_ADDRESS,
      validate: validate ? "true" : "false",
      ...(partnerId && { affiliate: partnerId }), // Used for PartnerTrackingContract
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
    validate = true,
    signature?: string
  ): Promise<TransactionRequest> {
    const network = Chains[this.chainId];
    const endpoint = `${API}/v1/portal/${network}`;
    const buyToken = this.serializeAddress(token);
    const params = new URLSearchParams({
      takerAddress: account,
      sellToken: vault,
      sellAmount: amount,
      buyToken,
      slippagePercentage: slippagePercentage.toString(),
      partner: YEARN_PARTNER_ADDRESS,
      validate: validate ? "true" : "false",
      ...(signature && { signature }),
    });
    const { tx } = await fetch(`${endpoint}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    return tx;
  }

  private serializeAddress(address: Address): Address {
    return address === EthAddress && isEthereum(this.chainId) ? ZeroAddress : getAddress(address);
  }

  private deserializeAddress(address: Address): Address {
    return address === ZeroAddress && isEthereum(this.chainId) ? EthAddress : getAddress(address);
  }
}
