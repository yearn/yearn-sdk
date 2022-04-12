import { MaxUint256 } from "@ethersproject/constants";
import { CallOverrides, Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { CachedFetcher } from "../cache";
import { allSupportedChains, ChainId, Chains, isEthereum, isFantom } from "../chain";
import { ServiceInterface } from "../common";
import { ETH_TOKEN, EthAddress, isNativeToken, WETH_TOKEN, WethAddress } from "../helpers";
import { FANTOM_TOKEN, mergeByAddress, SUPPORTED_ZAP_OUT_ADDRESSES_MAINNET, WrappedFantomAddress } from "../helpers";
import {
  Address,
  Integer,
  SdkError,
  SourceAddresses,
  SourceBalances,
  TokenAllowance,
  TokenMetadata,
  TypedMap,
  Usdc,
} from "../types";
import { Balance, Icon, IconMap, Token } from "../types";

const TokenAbi = [
  "function approve(address _spender, uint256 _value) public",
  "function allowance(address _owner, address _spender) public view returns (uint256)",
];

export class TokenInterface<C extends ChainId> extends ServiceInterface<C> {
  private cachedFetcherSupported = new CachedFetcher<Token[]>("tokens/supported", this.ctx, this.chainId);

  /**
   * Get exchange rate between two tokens.
   * @param from
   * @param to
   * @returns exchange rate
   */
  async price(from: Address, to: Address): Promise<Integer> {
    return this.yearn.services.oracle.getPriceFromRouter(from, to);
  }

  /**
   * Get the suggested Usdc exchange rate for an token.
   * @param token
   * @param overrides
   * @returns Usdc exchange rate (6 decimals)
   */
  async priceUsdc<T extends Address>(token: T, overrides?: CallOverrides): Promise<Usdc>;

  /**
   * Get the suggested Usdc exchange rate for list of tokens.
   * @param tokens
   * @param overrides
   * @returns Usdc exchange rate map (6 decimals)
   */
  async priceUsdc<T extends Address>(tokens: T[], overrides?: CallOverrides): Promise<TypedMap<T, Usdc>>;

  async priceUsdc<T extends Address>(tokens: T | T[], overrides?: CallOverrides): Promise<TypedMap<T, Usdc> | Usdc> {
    if (!Chains[this.chainId]) {
      throw new SdkError(`the chain ${this.chainId} hasn't been implemented yet`);
    }

    if (Array.isArray(tokens)) {
      const entries = await Promise.all(
        tokens.map(async (token) => {
          const price = await this.yearn.services.oracle.getPriceUsdc(token, overrides);
          return [token, price];
        })
      );
      return Object.fromEntries(entries) as TypedMap<T, Usdc>;
    }
    return this.yearn.services.oracle.getPriceUsdc(tokens, overrides);
  }

  /**
   * Fetch token balance for a particular account and token addresses.
   *
   * @param account user wallet address
   * @param tokenAddresses list of token addresses
   *
   * @returns list of balances for the supported tokens
   */
  async balances(account: Address, tokenAddresses?: Address[]): Promise<Balance[]> {
    let tokens = await this.supported();

    if (tokenAddresses) {
      tokens = tokens.filter(({ address }) => tokenAddresses.includes(address));
    }

    const addresses: SourceAddresses = tokens.reduce(
      (acc, { address, dataSource }) => {
        acc[dataSource].add(address);
        return acc;
      },
      {
        zapper: new Set<Address>(),
        vaults: new Set<Address>(),
        ironBank: new Set<Address>(),
        labs: new Set<Address>(),
        sdk: new Set<Address>(),
      }
    );

    const balances: SourceBalances = {
      zapper: [],
      vaults: [],
      ironBank: [],
      labs: [],
      sdk: [],
    };

    if (isEthereum(this.chainId)) {
      try {
        const zapperBalances = await this.yearn.services.zapper.balances(account);
        balances.zapper = zapperBalances.filter(({ address }) => addresses.zapper.has(address));
        const balance = await this.ctx.provider.read.getBalance(account);
        const priceUsdc = await this.yearn.services.oracle.getPriceUsdc(EthAddress);
        balances.sdk = [
          {
            address: EthAddress,
            token: ETH_TOKEN,
            balance: balance.toString(),
            balanceUsdc: new BigNumber(balance.toString())
              .div(10 ** 18)
              .times(new BigNumber(priceUsdc))
              .toString(),
            priceUsdc,
          },
        ];

        const hasWeth = zapperBalances.find(({ address }) => WethAddress === address);

        if (!hasWeth) {
          balances.sdk = [
            ...balances.sdk,
            {
              address: WethAddress,
              token: WETH_TOKEN,
              balance: "0",
              balanceUsdc: "0",
              priceUsdc,
            },
          ];
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (isFantom(this.chainId)) {
      const balance = await this.ctx.provider.read.getBalance(account);
      const priceUsdc = await this.yearn.services.oracle.getPriceUsdc(WrappedFantomAddress);
      balances.sdk = [
        {
          address: account,
          token: FANTOM_TOKEN,
          balance: balance.toString(),
          balanceUsdc: new BigNumber(balance.toString())
            .div(10 ** 18)
            .times(new BigNumber(priceUsdc))
            .toString(),
          priceUsdc,
        },
      ];
    }

    if (allSupportedChains.includes(this.chainId)) {
      const vaultBalances = await this.yearn.vaults.balances(account);
      balances.vaults = vaultBalances.filter(
        ({ address, balance }) => balance !== "0" && addresses.vaults.has(address)
      );

      const ironBankBalances = await this.yearn.ironBank.balances(account);
      balances.ironBank = ironBankBalances.filter(({ address }) => addresses.ironBank.has(address));

      return [...balances.vaults, ...balances.ironBank, ...balances.zapper, ...balances.sdk];
    }

    console.error(`the chain ${this.chainId} hasn't been implemented yet`);

    return [];
  }

  /**
   * Fetch all the tokens supported along with some basic metadata.
   * @returns list of tokens supported.
   */
  async supported(): Promise<Token[]> {
    if (!allSupportedChains.includes(this.chainId)) {
      console.error(`the chain ${this.chainId} hasn't been implemented yet`);

      return [];
    }

    const cached = await this.cachedFetcherSupported.fetch();
    if (cached) {
      return cached;
    }

    // Zapper only supported in Ethereum
    let zapperTokens: Token[] = [];
    if (isEthereum(this.chainId)) {
      try {
        zapperTokens = await this.getZapperTokensWithIcons();
      } catch (error) {
        console.error(error);
      }
    }

    const vaultsTokens = await this.yearn.vaults.tokens();
    const ironBankTokens = await this.yearn.ironBank.tokens();

    const vaultsAndIronBankTokens = mergeByAddress(vaultsTokens, ironBankTokens);

    if (isFantom(this.chainId)) {
      const priceUsdc = await this.yearn.services.oracle.getPriceUsdc(WrappedFantomAddress);
      vaultsAndIronBankTokens.push({ ...FANTOM_TOKEN, priceUsdc });
    }

    if (!zapperTokens.length) {
      return vaultsAndIronBankTokens;
    }

    const allSupportedTokens = mergeByAddress(vaultsAndIronBankTokens, zapperTokens);

    const zapperTokensUniqueAddresses = new Set(zapperTokens.map(({ address }) => address));

    return allSupportedTokens.map((token) => {
      const isZapperToken = zapperTokensUniqueAddresses.has(token.address);

      return {
        ...token,
        ...(isZapperToken && {
          supported: {
            ...token.supported,
            zapper: true,
            zapperZapIn: true,
            zapperZapOut: Object.values(SUPPORTED_ZAP_OUT_ADDRESSES_MAINNET).includes(token.address),
          },
        }),
      };
    });
  }

  /**
   * Fetch the token amount that spender is allowed to spend on behalf of owner
   * @param ownerAddress
   * @param tokenAddress
   * @param spenderAddress
   * @returns TokenAllowance
   */
  async allowance(ownerAddress: Address, tokenAddress: Address, spenderAddress: Address): Promise<TokenAllowance> {
    const allowance: TokenAllowance = {
      owner: ownerAddress,
      token: tokenAddress,
      spender: spenderAddress,
      amount: MaxUint256.toString(),
    };

    if (isNativeToken(tokenAddress) || tokenAddress === spenderAddress) return allowance;

    const tokenContract = new Contract(tokenAddress, TokenAbi, this.ctx.provider.read);
    const allowanceAmount = await tokenContract.allowance(ownerAddress, spenderAddress);

    return {
      ...allowance,
      amount: allowanceAmount.toString(),
    };
  }

  /**
   * Approve the token amount that spender is allowed to spend on behalf of owner
   * @param ownerAddress
   * @param tokenAddress
   * @param spenderAddress
   * @param amount
   * @param overrides
   * @returns TokenAllowance
   */
  async approve(
    ownerAddress: Address,
    tokenAddress: Address,
    spenderAddress: Address,
    amount: Integer,
    overrides: CallOverrides = {}
  ): Promise<TransactionResponse> {
    if (isNativeToken(tokenAddress)) throw new SdkError(`Native tokens cant be approved: ${tokenAddress}`);
    if (tokenAddress === spenderAddress) throw new SdkError(`Cant approve token as its spender: ${tokenAddress}`);

    const signer = this.ctx.provider.write.getSigner(ownerAddress);
    const tokenContract = new Contract(tokenAddress, TokenAbi, signer);
    const tx = await tokenContract.populateTransaction.approve(spenderAddress, amount, overrides);

    return this.yearn.services.transaction.sendTransaction(tx);
  }

  /**
   * Fetches supported zapper tokens and sets their icon
   * @returns zapper tokens with icons
   */
  private async getZapperTokensWithIcons(): Promise<Token[]> {
    const zapperTokens = await this.yearn.services.zapper.supportedTokens();

    const zapperTokensAddresses = zapperTokens.map(({ address }) => address);

    const zapperTokensIcons = await this.yearn.services.asset.ready.then(() =>
      this.yearn.services.asset.icon(zapperTokensAddresses)
    );

    const setIcon = (token: Token): Token => {
      const icon = zapperTokensIcons[token.address];
      return icon ? { ...token, icon } : token;
    };

    return zapperTokens.map(setIcon);
  }

  /**
   * Get an icon url for a particular address.
   * @param address
   */
  icon<T extends Address>(address: T): Icon;

  /**
   * Get a map of icons for a list of addresses.
   * @param addresses
   */

  icon<T extends Address>(addresses: T[]): IconMap<T>;

  icon<T extends Address>(address: T | T[]): IconMap<T> | Icon {
    return this.yearn.services.asset.icon(address);
  }

  private cachedFetcher = new CachedFetcher<TokenMetadata[]>("tokens/metadata", this.ctx, this.chainId);

  async metadata(addresses?: Address[]): Promise<TokenMetadata[]> {
    let result: TokenMetadata[];

    const cached = await this.cachedFetcher.fetch();
    if (cached) {
      result = cached;
    } else {
      result = await this.yearn.services.meta.tokens();
    }

    if (addresses) {
      return result.filter((metadata) => addresses.includes(metadata.address));
    } else {
      return result;
    }
  }
}
