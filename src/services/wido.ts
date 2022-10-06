import { getAddress } from "@ethersproject/address";
import { TransactionRequest } from "@ethersproject/providers";
import { approveForZap, getBalances, getSupportedTokens, getTokenAllowance, quote } from "wido";

import { Chains, NETWORK_SETTINGS } from "../chain";
import { Service } from "../common";
import { usdc } from "../helpers";
import { Address, Balance, Integer, Token, TokenAllowance } from "../types";

export class WidoService extends Service {
  async supportedTokens(): Promise<Token[]> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }
    const networkSettings = NETWORK_SETTINGS[this.chainId];
    const network = Chains[this.chainId];
    const tokenList = await getSupportedTokens({
      chainId: [this.chainId],
      includeMetadata: true,
      includePricing: true,
      includeUnknown: false,
    });

    return tokenList.map((token) => {
      return {
        address: getAddress(token.address),
        decimals: String(token.decimals),
        icon: `https://assets.yearn.network/tokens/${network}/${token.address.toLowerCase()}.png`,
        name: token.symbol,
        priceUsdc: token.usdPrice,
        dataSource: "wido",
        supported: {
          widoZapIn: true,
          widoZapOut: networkSettings.zapOutTokenSymbols?.includes(token.symbol.toUpperCase()),
        },
        symbol: token.symbol,
      };
    });
  }

  async balances<T extends Address>(address: T): Promise<Balance[]> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }
    const balances = await getBalances(address, [this.chainId]);

    return balances.map((balance) => {
      return {
        address: getAddress(balance.address),
        token: {
          address,
          name: balance.symbol,
          symbol: balance.symbol,
          decimals: String(balance.decimals),
        },
        balance: balance.balance,
        balanceUsdc: usdc(balance.balanceUsdValue),
        priceUsdc: usdc(balance.usdPrice),
      };
    });
  }

  async supportedVaultAddresses(): Promise<Address[]> {
    if (this.chainId !== 1) {
      throw new Error("Unsupported");
    }

    const vaultList = await getSupportedTokens({
      chainId: [this.chainId],
      protocol: ["yearn.finance"],
    });

    return vaultList.map((vault) => vault.address);
  }

  async zapInApprovalState(token: Address, account: Address): Promise<TokenAllowance> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { spender, allowance } = await getTokenAllowance({
      chainId: this.chainId,
      accountAddress: account,
      tokenAddress: token,
    });

    return {
      token,
      owner: account,
      spender,
      amount: allowance,
    };
  }

  async zapInApprovalTransaction(token: Address, amount: Integer): Promise<TransactionRequest> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { data, to } = await approveForZap({
      chainId: this.chainId,
      tokenAddress: token,
      amount,
    });

    return { data, to };
  }

  async zapOutApprovalState(vault: Address, account: Address): Promise<TokenAllowance> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { spender, allowance } = await getTokenAllowance({
      chainId: this.chainId,
      accountAddress: account,
      tokenAddress: vault,
    });

    return {
      token: vault,
      owner: account,
      spender,
      amount: allowance,
    };
  }

  async zapOutApprovalTransaction(vault: Address, amount: Integer): Promise<TransactionRequest> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { data, to } = await approveForZap({
      chainId: this.chainId,
      tokenAddress: vault,
      amount,
    });

    return { data, to };
  }

  async zapIn(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    slippagePercentage: number
  ): Promise<TransactionRequest> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { data, to, from, value } = await quote({
      fromChainId: this.chainId,
      fromToken: token,
      toChainId: this.chainId,
      toToken: vault,
      amount,
      slippagePercentage,
      user: account,
    });

    return { data, to, from, value };
  }

  async zapOut(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    slippagePercentage: number
  ): Promise<TransactionRequest> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { data, to, from, value } = await quote({
      fromChainId: this.chainId,
      fromToken: vault,
      toChainId: this.chainId,
      toToken: token,
      amount,
      slippagePercentage,
      user: account,
    });

    return { data, to, from, value };
  }
}
