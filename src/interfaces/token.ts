import { MaxUint256 } from "@ethersproject/constants";
import { CallOverrides, Contract } from "@ethersproject/contracts";
import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { CachedFetcher } from "../cache";
import { ChainId, Chains } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import { Address, Integer, TokenAllowance, TokenMetadata, TypedMap, Usdc, Vault, ZapProtocol } from "../types";
import { Balance, Icon, IconMap, Token } from "../types";

const TokenAbi = [
  "function approve(address _spender, uint256 _value) public",
  "function allowance(address _owner, address _spender) public view returns (uint256)"
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
  async priceUsdc<T extends Address>(token: T, overrides?: CallOverrides): Promise<Usdc | null>;

  /**
   * Get the suggested Usdc exchange rate for list of tokens.
   * @param tokens
   * @param overrides
   * @returns Usdc exchange rate map (6 decimals)
   */
  async priceUsdc<T extends Address>(tokens: T[], overrides?: CallOverrides): Promise<TypedMap<T, Usdc> | null>;

  async priceUsdc<T extends Address>(
    tokens: T | T[],
    overrides?: CallOverrides
  ): Promise<TypedMap<T, Usdc> | Usdc | null> {
    if (!Chains[this.chainId]) {
      console.error(`the chain ${this.chainId} hasn't been implemented yet`);
      return null;
    }

    if (Array.isArray(tokens)) {
      const entries = await Promise.all(
        tokens.map(async token => {
          const price = await this.yearn.services.oracle.getPriceUsdc(token, overrides);
          return [token, price];
        })
      );
      return Object.fromEntries(entries) as TypedMap<T, Usdc>;
    }
    return this.yearn.services.oracle.getPriceUsdc(tokens, overrides);
  }

  /**
   * Fetch token balances from the {@link TokenInterface.supported} list
   * for a particular address.
   * @param address
   */
  async balances(address: Address): Promise<Balance[]> {
    const vaultBalances = await this.yearn.vaults
      .balances(address)
      .then(balances => balances.filter(token => token.balance !== "0"));

    switch (this.chainId) {
      case 1:
      case 1337: {
        let zapperBalances: Balance[] = [];
        try {
          zapperBalances = await this.yearn.services.zapper.balances(address);
        } catch (error) {
          console.error(error);
        }
        const vaultBalanceAddresses = new Set(vaultBalances.map(balance => balance.address));
        zapperBalances = zapperBalances.filter(balance => !vaultBalanceAddresses.has(balance.address));
        return zapperBalances.concat(vaultBalances);
      }
      case 250:
      case 42161: {
        let ironBankTokens = await this.yearn.ironBank.balances(address);
        const vaultBalanceAddresses = new Set(vaultBalances.map(balance => balance.address));
        ironBankTokens = ironBankTokens.filter(balance => !vaultBalanceAddresses.has(balance.address));
        return ironBankTokens.concat(vaultBalances);
      }
      default:
        console.error(`the chain ${this.chainId} hasn't been implemented yet`);
        return [];
    }
  }

  /**
   * Fetch all the tokens supported along with some basic metadata.
   * @returns list of tokens supported.
   */
  async supported(): Promise<Token[]> {
    const cached = await this.cachedFetcherSupported.fetch();
    if (cached) {
      return cached;
    }

    let zapperTokensWithIcon: Token[] = [];

    // Zapper only supported in Ethereum
    if ([1, 1337].includes(this.chainId)) {
      try {
        zapperTokensWithIcon = await this.getZapperTokensWithIcons();
      } catch (error) {
        console.error(error);
      }
    }

    if ([1, 1337, 250, 42161].includes(this.chainId)) {
      const vaultsTokens = await this.yearn.vaults.tokens();
      const ironBankTokens = await this.yearn.ironBank.tokens();

      const combinedVaultsAndIronBankTokens = this.mergeTokens(vaultsTokens, ironBankTokens);

      if (!zapperTokensWithIcon.length) {
        return combinedVaultsAndIronBankTokens;
      }

      const allSupportedTokens = this.mergeTokens(combinedVaultsAndIronBankTokens, zapperTokensWithIcon);

      const zapperTokensUniqueAddresses = new Set(zapperTokensWithIcon.map(({ address }) => address));

      return allSupportedTokens.map(token => {
        const isZapperToken = zapperTokensUniqueAddresses.has(token.address);

        return {
          ...token,
          ...(isZapperToken && {
            supported: {
              ...token.supported,
              zapper: true
            }
          })
        };
      });
    }

    console.error(`the chain ${this.chainId} hasn't been implemented yet`);

    return [];
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

    const setIcon = (token: Token) => {
      const icon = zapperTokensIcons[token.address];
      return icon ? { ...token, icon } : token;
    };

    return zapperTokens.map(setIcon);
  }

  /**
   * Get allowance for a token either zapIn or direct deposit
   * @param vault
   * @param token
   * @param amount
   * @param account
   * @returns transaction
   */
  async allowance(address: Address, vaultToken: Address, token: Address, account: Address): Promise<TokenAllowance> {
    // If Ether is being sent, no need for approval
    let allowance: TokenAllowance = {
      owner: account,
      spender: address,
      amount: MaxUint256.toString(),
      token
    };

    if (EthAddress === token) return allowance;

    if (vaultToken === token) {
      const tokenContract = new Contract(token, TokenAbi, this.ctx.provider.read);
      const partnerAddress = await this.yearn.services.partner?.address;
      const addressToApprove = (this.shouldUsePartnerService(address) && partnerAddress) || address;
      const allowanceAmount = await tokenContract.allowance(account, addressToApprove);

      return {
        ...allowance,
        spender: addressToApprove,
        amount: allowanceAmount.toString()
      };
    }

    const zapProtocol = PickleJars.includes(address) ? ZapProtocol.PICKLE : ZapProtocol.YEARN;

    const zapInApprovalState = await this.yearn.services.zapper.zapInApprovalState(account, token, zapProtocol);

    return {
      owner: zapInApprovalState.ownerAddress,
      spender: zapInApprovalState.spenderAddress,
      amount: zapInApprovalState.allowance,
      token
    };
  }

  /**
   * Approve vault to spend a token on zapIn or direct deposit
   * @param vault
   * @param token
   * @param amount
   * @param account
   * @returns transaction
   */
  async approveDeposit(
    address: Address,
    vaultToken: Address,
    token: Address,
    amount: Integer,
    account: Address
  ): Promise<TransactionResponse | Boolean> {
    // If Ether is being sent, no need for approval
    if (EthAddress === token) return true;

    const signer = this.ctx.provider.write.getSigner(account);

    if (vaultToken === token) {
      const tokenContract = new Contract(token, TokenAbi, signer);
      const partnerAddress = await this.yearn.services.partner?.address;
      const addressToApprove = (this.shouldUsePartnerService(address) && partnerAddress) || address;
      const tx = await tokenContract.populateTransaction.approve(addressToApprove, amount);
      return this.yearn.services.transaction.sendTransaction(tx);
    }

    const gasPrice = await this.yearn.services.zapper.gas();

    const gasPriceFastGwei = new BigNumber(gasPrice.fast).times(new BigNumber(10 ** 9));

    const zapProtocol = PickleJars.includes(address) ? ZapProtocol.PICKLE : ZapProtocol.YEARN;

    const zapInApprovalState = await this.yearn.services.zapper.zapInApprovalState(account, token, zapProtocol);

    if (!zapInApprovalState.isApproved) {
      const zapInApprovalParams = await this.yearn.services.zapper.zapInApprovalTransaction(
        account,
        token,
        gasPriceFastGwei.toString(),
        zapProtocol
      );
      const transaction: TransactionRequest = {
        to: zapInApprovalParams.to,
        from: zapInApprovalParams.from,
        gasPrice: zapInApprovalParams.gasPrice,
        data: zapInApprovalParams.data as string
      };
      return signer.sendTransaction(transaction);
    }

    return true;
  }

  /**
   * Approve vault to spend a vault token on zapOut
   * @param vault
   * @param token
   * @param account
   * @returns transaction
   */
  async approveZapOut(vault: Vault, token: Address, account: Address): Promise<TransactionResponse | Boolean> {
    const signer = this.ctx.provider.write.getSigner(account);
    if (vault.token === token) {
      const gasPrice = await this.yearn.services.zapper.gas();
      const gasPriceFastGwei = new BigNumber(gasPrice.fast).times(new BigNumber(10 ** 9));

      let sellToken = token;

      const zapOutApprovalState = await this.yearn.services.zapper.zapOutApprovalState(account, sellToken);
      if (!zapOutApprovalState.isApproved) {
        const zapOutApprovalParams = await this.yearn.services.zapper.zapOutApprovalTransaction(
          account,
          sellToken,
          gasPriceFastGwei.toString()
        );
        const transaction: TransactionRequest = {
          to: zapOutApprovalParams.to,
          from: zapOutApprovalParams.from,
          gasPrice: zapOutApprovalParams.gasPrice,
          data: zapOutApprovalParams.data as string
        };
        return signer.sendTransaction(transaction);
      }
    }
    return false;
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

  private shouldUsePartnerService(vault: string): boolean {
    return !!this.yearn.services.partner?.isAllowed(vault);
  }

  async metadata(addresses?: Address[]): Promise<TokenMetadata[]> {
    let result: TokenMetadata[];

    const cached = await this.cachedFetcher.fetch();
    if (cached) {
      result = cached;
    } else {
      result = await this.yearn.services.meta.tokens();
    }

    if (addresses) {
      return result.filter(metadata => addresses.includes(metadata.address));
    } else {
      return result;
    }
  }

  /**
   * Merges token array b into a removing a duplicates from b
   * @param a higher priority array
   * @param b lower priority array
   * @returns combined token array without duplicates
   */
  private mergeTokens(a: Token[], b: Token[]): Token[] {
    const filter = new Set(a.map(({ address }) => address));

    return [...a, ...b.filter(({ address }) => !filter.has(address))];
  }
}
