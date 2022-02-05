import { CallOverrides, Contract } from "@ethersproject/contracts";
import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { CachedFetcher } from "../cache";
import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import { Address, Integer, SdkError, TokenMetadata, TypedMap, Usdc, Vault, ZapProtocol } from "../types";
import { Balance, Icon, IconMap, Token } from "../types";

const TokenAbi = ["function approve(address _spender, uint256 _value) public"];

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

    if (this.chainId === 1 || this.chainId === 1337) {
      let zapperBalances = await this.yearn.services.zapper.balances(address);
      const vaultBalanceAddresses = new Set(vaultBalances.map(balance => balance.address));
      zapperBalances = zapperBalances.filter(balance => !vaultBalanceAddresses.has(balance.address));
      return zapperBalances.concat(vaultBalances);
    } else if (this.chainId === 250 || this.chainId === 42161) {
      let ironBankTokens = await this.yearn.ironBank.balances(address);
      const vaultBalanceAddresses = new Set(vaultBalances.map(balance => balance.address));
      ironBankTokens = ironBankTokens.filter(balance => !vaultBalanceAddresses.has(balance.address));
      return ironBankTokens.concat(vaultBalances);
    } else {
      throw new SdkError(`the chain ${this.chainId} hasn't been implemented yet`);
    }
  }

  /**
   * Fetch all the tokens supported by the zapper protocol along with some basic
   * metadata.
   * @returns list of tokens supported by the zapper protocol.
   */
  async supported(): Promise<Token[]> {
    const cached = await this.cachedFetcherSupported.fetch();
    if (cached) {
      return cached;
    }

    if (this.chainId === 1 || this.chainId === 1337) {
      // only ETH Main is supported
      const tokens = await this.yearn.services.zapper.supportedTokens();
      const icons = await this.yearn.services.asset.ready.then(() =>
        this.yearn.services.asset.icon(tokens.map(token => token.address))
      );
      return tokens.map(token => {
        const icon = icons[token.address];
        return icon ? { ...token, icon } : token;
      });
    }
    return [];
  }

  /**
   * Approve vault to spend a token on zapIn
   * @param vault
   * @param token
   * @param amount
   * @param account
   * @returns transaction
   */
  async approve(
    vault: Vault,
    token: Address,
    amount: Integer,
    account: Address
  ): Promise<TransactionResponse | Boolean> {
    const signer = this.ctx.provider.write.getSigner(account);
    if (vault.token === token) {
      const tokenContract = new Contract(token, TokenAbi, signer);
      const tx = await tokenContract.populateTransaction.approve(vault.address, amount);
      return this.yearn.services.transaction.sendTransaction(tx);
    } else {
      const gasPrice = await this.yearn.services.zapper.gas();
      const gasPriceFastGwei = new BigNumber(gasPrice.fast).times(new BigNumber(10 ** 9));

      if (EthAddress === token) {
        // If Ether is being sent, no need for approval
        return true;
      }
      const zapProtocol = PickleJars.includes(vault.address) ? ZapProtocol.PICKLE : ZapProtocol.YEARN;
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
      } else {
        return true;
      }
    }
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
}
