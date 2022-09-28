import { getAddress } from "@ethersproject/address";
import { TransactionRequest } from "@ethersproject/providers";
import { approveForZap, getBalances, getSupportedTokens, getTokenAllowance, getWidoContractAddress, quote } from "wido";

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
    const tokenList = await getSupportedTokens(this.chainId, true, false);

    return tokenList.map((token) => {
      return {
        address: getAddress(token.address),
        decimals: String(token.decimals),
        icon: `https://assets.yearn.network/tokens/${network}/${token.address.toLowerCase()}.png`,
        name: token.symbol,
        priceUsdc: usdc("0"), // TODO(wido)
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
        priceUsdc: usdc(balance.tokenUsdPrice),
      };
    });
  }

  async supportedVaultAddresses(): Promise<Address[]> {
    if (this.chainId !== 1) {
      throw new Error("Unsupported");
    }
    return [
      "0xdCD90C7f6324cfa40d7169ef80b12031770B4325", // yvCurve-stETH
      "0x3B27F92C0e212C671EA351827EDF93DB27cc0c65", // yvUSDT
      "0x7Da96a3891Add058AdA2E826306D812C638D87a7", // yvUSDT (old vault) (withdraw only)
      "0x27b7b1ad7288079A66d12350c828D3C00A6F07d7", // yvCurve-IronBank
      "0xdb25cA703181E7484a155DD612b06f57E12Be5F0", // yvYFI
    ];
  }

  getContractAddress() {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    return getWidoContractAddress(this.chainId);
  }

  async zapInApprovalState(token: Address, account: Address): Promise<TokenAllowance> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const widoContract = getWidoContractAddress(this.chainId);

    const allowance = await getTokenAllowance(
      {
        accountAddress: account,
        spenderAddress: widoContract,
        tokenAddress: token,
      },
      this.ctx.provider.read
    );

    return {
      token,
      owner: account,
      spender: widoContract,
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

    const widoContract = getWidoContractAddress(this.chainId);

    const allowance = await getTokenAllowance(
      {
        accountAddress: account,
        spenderAddress: widoContract,
        tokenAddress: vault,
      },
      this.ctx.provider.read
    );

    return {
      token: vault,
      owner: account,
      spender: widoContract,
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

    const { data, to } = await quote(
      {
        fromChainId: this.chainId,
        fromToken: token,
        toChainId: this.chainId,
        toToken: vault,
        amount,
        slippagePercentage,
        user: account,
      },
      this.ctx.provider.read
    );

    return { data, to, from: account };
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

    const { data, to } = await quote(
      {
        fromChainId: this.chainId,
        fromToken: vault,
        toChainId: this.chainId,
        toToken: token,
        amount,
        slippagePercentage,
        user: account,
      },
      this.ctx.provider.read
    );

    return { data, to, from: account };
  }
}
