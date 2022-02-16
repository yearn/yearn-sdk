import { BigNumber } from "@ethersproject/bignumber";
import { CallOverrides, Contract } from "@ethersproject/contracts";
import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import { JsonRpcSigner } from "@ethersproject/providers";

import { CachedFetcher } from "../cache";
import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { chunkArray, EthAddress, WethAddress } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import {
  Address,
  Apy,
  Balance,
  DepositOptions,
  Integer,
  SdkError,
  Token,
  TokenMetadata,
  VaultDynamic,
  VaultMetadataOverrides,
  VaultStatic,
  VaultsUserSummary,
  VaultUserMetadata,
  WithdrawOptions,
  ZapProtocol
} from "../types";
import { Position, Vault } from "../types";

const VaultAbi = ["function deposit(uint256 amount) public", "function withdraw(uint256 amount) public"];

export class VaultInterface<T extends ChainId> extends ServiceInterface<T> {
  private cachedFetcherGet = new CachedFetcher<Vault[]>("vaults/get", this.ctx, this.chainId);
  private cachedFetcherGetDynamic = new CachedFetcher<VaultDynamic[]>("vaults/getDynamic", this.ctx, this.chainId);
  private cachedFetcherTokens = new CachedFetcher<Token[]>("vaults/tokens", this.ctx, this.chainId);

  /**
   * Get all yearn vaults.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async get(addresses?: Address[], overrides?: CallOverrides): Promise<Vault[]> {
    const cached = await this.cachedFetcherGet.fetch();
    if (cached) {
      if (addresses) {
        return cached.filter(vault => addresses.includes(vault.address));
      } else {
        return cached;
      }
    }

    const vaultMetadataOverridesPromise = this.yearn.services.meta.vaults().catch(error => {
      console.error(error);
      return Promise.resolve([]);
    });

    const [vaultMetadataOverrides, assetsStatic] = await Promise.all([
      vaultMetadataOverridesPromise,
      this.getStatic(addresses, overrides)
    ]);

    let assetsDynamic: VaultDynamic[] = [];
    try {
      assetsDynamic = await this.getDynamic();
    } catch {
      const allAddresses = assetsStatic.map(asset => asset.address);
      const chunks = chunkArray(allAddresses, 30);
      const promises = chunks.map(async chunk => this.getDynamic(chunk, vaultMetadataOverrides, overrides));
      assetsDynamic = await Promise.all(promises).then(chunks => chunks.flat());
    }

    const strategiesMetadataPromise = this.yearn.strategies
      .vaultsStrategiesMetadata(assetsDynamic.map(asset => asset.address))
      .catch(error => {
        console.error(error);
        return Promise.resolve([]);
      });

    let assetsHistoricEarningsPromise = this.yearn.earnings.assetsHistoricEarnings().catch(error => {
      console.error(error);
      return Promise.resolve([]);
    });

    const [strategiesMetadata, assetsHistoricEarnings] = await Promise.all([
      strategiesMetadataPromise,
      assetsHistoricEarningsPromise
    ]);

    const assetsWithOrder: { vault: Vault; order: number }[] = [];

    for (const asset of assetsStatic) {
      const dynamic = assetsDynamic.find(({ address }) => asset.address === address);
      if (!dynamic) {
        throw new SdkError(`Dynamic asset does not exist for ${asset.address}`);
      }
      const overrides = vaultMetadataOverrides.find(override => override.address === asset.address);
      if (overrides?.hideAlways) {
        continue;
      }
      const order = overrides?.order ?? Math.max();

      dynamic.metadata.displayName = dynamic.metadata.displayName || asset.name;
      dynamic.metadata.strategies = strategiesMetadata.find(metadata => metadata.vaultAddress === asset.address);
      dynamic.metadata.historicEarnings = assetsHistoricEarnings.find(
        earnings => earnings.assetAddress === asset.address
      )?.dayData;

      assetsWithOrder.push({ vault: { ...asset, ...dynamic }, order });
    }

    return assetsWithOrder.sort((lhs, rhs) => lhs.order - rhs.order).map(asset => asset.vault);
  }

  /**
   * Get static part of yearn vaults.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async getStatic(addresses?: Address[], overrides?: CallOverrides): Promise<VaultStatic[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        return await adapter.assetsStatic(addresses, overrides);
      })
    ).then(arr => arr.flat());
  }

  /**
   * Get dynamic part of yearn vaults.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async getDynamic(
    addresses?: Address[],
    vaultMetadataOverrides?: VaultMetadataOverrides[],
    overrides?: CallOverrides
  ): Promise<VaultDynamic[]> {
    const cached = await this.cachedFetcherGetDynamic.fetch();
    if (cached) {
      return addresses ? cached.filter(vault => addresses.includes(vault.address)) : cached;
    }

    let metadataOverrides = vaultMetadataOverrides
      ? vaultMetadataOverrides
      : await this.yearn.services.meta.vaults().catch(error => {
          console.error(error);
          return Promise.resolve([]);
        });

    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        const data = await adapter.assetsDynamic(addresses, overrides);
        const assetsApy = await this.yearn.services.vision.apy(data.map(dynamic => dynamic.address));
        return data.map(dynamic => {
          const overrides = metadataOverrides.find(override => override.address === dynamic.address);
          dynamic.metadata.apy = assetsApy[dynamic.address];
          if (dynamic.tokenId === WethAddress) {
            const icon = this.yearn.services.asset.icon(EthAddress) ?? "";
            dynamic.metadata.displayIcon = icon;
            dynamic.metadata.displayName = "ETH";
            dynamic.metadata.defaultDisplayToken = EthAddress;
          } else {
            const icon = this.yearn.services.asset.icon(dynamic.tokenId) ?? "";
            dynamic.metadata.displayIcon = icon;
            const alias = this.yearn.services.asset.alias(dynamic.tokenId);
            dynamic.metadata.displayName = alias ? alias.symbol : "";
            dynamic.metadata.defaultDisplayToken = dynamic.tokenId;
          }
          if (overrides) {
            this.fillMetadataOverrides(dynamic, overrides);
          }
          return dynamic;
        });
      })
    ).then(arr => arr.flat());
  }

  /**
   * Get yearn vault positions for a particular address.
   * @param address
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async positionsOf(address: Address, addresses?: Address[], overrides?: CallOverrides): Promise<Position[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        try {
          return await adapter.positionsOf(address, addresses, overrides);
        } catch {
          let allAddresses: Address[];
          if (addresses) {
            allAddresses = addresses;
          } else {
            allAddresses = await this.getStatic(addresses, overrides).then(assets =>
              assets.map(asset => asset.address)
            );
          }
          const chunks = chunkArray(allAddresses, 30);
          const promises = chunks.map(async chunk => adapter.positionsOf(address, chunk, overrides));
          return await Promise.all(promises).then(chunks => chunks.flat());
        }
      })
    ).then(arr => arr.flat());
  }

  /**
   * Get the Vaults User Summary for a particular address.
   * @param address
   * @returns
   */
  async summaryOf(address: Address): Promise<VaultsUserSummary> {
    const { earnings, holdings, grossApy, estimatedYearlyYield } = await this.yearn.earnings.accountAssetsData(address);
    return { earnings, holdings, grossApy, estimatedYearlyYield };
  }

  /**
   * Get the Vault User Metadata for a particular address.
   * @param address
   * @param addresses filter, if provided only those addresses' Vault User Metadata are returned
   * @returns
   */
  async metadataOf(address: Address, addresses?: Address[]): Promise<VaultUserMetadata[]> {
    const { earningsAssetData } = await this.yearn.earnings.accountAssetsData(address);
    if (!addresses) return earningsAssetData;
    return earningsAssetData.filter(asset => addresses.includes(asset.assetAddress));
  }

  /**
   * Get all yearn vault's underlying token balances for a particular address.
   * @param address
   * @param overrides
   * @returns
   */
  async balances(address: Address, overrides?: CallOverrides): Promise<Balance[]> {
    const tokens = await this.tokens();
    const balances = await this.yearn.services.helper.tokenBalances(
      address,
      tokens.map(token => token.address),
      overrides
    );
    return balances.map(balance => {
      const token = tokens.find(token => token.address === balance.address);
      if (!token) {
        throw new SdkError(`Token does not exist for Balance(${balance.address})`);
      }
      return {
        ...balance,
        token
      };
    });
  }

  /**
   * Get all yearn vault's underlying tokens.
   * @param overrides
   * @returns
   */
  async tokens(overrides?: CallOverrides): Promise<Token[]> {
    const cached = await this.cachedFetcherTokens.fetch();
    if (cached) {
      return cached;
    }

    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    await this.yearn.services.asset.ready;
    return await Promise.all(
      adapters.map(async adapter => {
        const tokenAddresses = await adapter.tokens(overrides);
        const icons = this.yearn.services.asset.icon(tokenAddresses.concat(EthAddress));
        const tokensPromise = this.yearn.services.helper.tokens(tokenAddresses, overrides);
        const tokensMetadataPromise = this.yearn.tokens.metadata(tokenAddresses);

        const [tokens, tokensMetadata] = await Promise.all([tokensPromise, tokensMetadataPromise]);

        return Promise.all(
          tokens.map(async token => {
            const tokenMetadata = tokensMetadata.find(metadata => metadata.address === token.address);
            const result: Token = {
              ...token,
              icon: icons[token.address],
              supported: {},
              priceUsdc: await this.yearn.services.oracle.getPriceUsdc(token.address, overrides),
              metadata: tokenMetadata
            };
            const symbolOverride = this.yearn.services.asset.alias(token.address)?.symbol;
            if (symbolOverride) {
              result.symbol = symbolOverride;
            }
            if (tokenMetadata) {
              this.fillTokenMetadataOverrides(result, tokenMetadata);
            }
            return result;
          })
        );
      })
    ).then(arr => arr.flat());
  }

  /**
   * Deposit into a yearn vault
   * @param vault
   * @param token
   * @param amount
   * @param account
   * @param overrides
   * @returns transaction
   */
  async deposit(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    options: DepositOptions = {},
    overrides: CallOverrides = {}
  ): Promise<TransactionResponse> {
    const signer = this.ctx.provider.write.getSigner(account);
    const isZappingIntoPickleJar = PickleJars.includes(vault);

    if (isZappingIntoPickleJar) {
      return this.zapIn(vault, token, amount, account, signer, options, ZapProtocol.PICKLE, overrides);
    }

    const [vaultRef] = await this.getStatic([vault], overrides);
    if (vaultRef.token === token) {
      if (token === EthAddress) {
        throw new SdkError("deposit:v2:eth not implemented");
      } else {
        const vaultContract = new Contract(vault, VaultAbi, signer);
        const makeTransaction = (overrides: CallOverrides) => vaultContract.deposit(amount, overrides);
        return this.executeVaultContractTransaction(makeTransaction, overrides);
      }
    } else {
      return this.zapIn(vault, token, amount, account, signer, options, ZapProtocol.YEARN, overrides);
    }
  }

  /**
   * Withdraw from a yearn vault.
   * @param vault
   * @param token
   * @param amount
   * @param account
   * @param overrides
   * @returns transaction
   */
  async withdraw(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    options: WithdrawOptions = {},
    overrides: CallOverrides = {}
  ): Promise<TransactionResponse> {
    const [vaultRef] = await this.getStatic([vault], overrides);
    const signer = this.ctx.provider.write.getSigner(account);
    if (vaultRef.token === token) {
      const vaultContract = new Contract(vault, VaultAbi, signer);
      const makeTransaction = (overrides: CallOverrides) => vaultContract.withdraw(amount, overrides);
      return this.executeVaultContractTransaction(makeTransaction, overrides);
    } else {
      if (options.slippage === undefined) {
        throw new SdkError("zap operations should have a slippage set");
      }

      const zapOutParams = await this.yearn.services.zapper.zapOut(
        account,
        token,
        amount,
        vault,
        "0",
        options.slippage,
        false
      );

      const transactionRequest: TransactionRequest = {
        to: zapOutParams.to,
        from: zapOutParams.from,
        gasPrice: BigNumber.from(zapOutParams.gasPrice),
        gasLimit: BigNumber.from(zapOutParams.gas),
        data: zapOutParams.data,
        value: BigNumber.from(zapOutParams.value)
      };

      return this.executeZapperTransaction(
        transactionRequest,
        overrides,
        BigNumber.from(zapOutParams.gasPrice),
        signer
      );
    }
  }

  private async zapIn(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    signer: JsonRpcSigner,
    options: DepositOptions = {},
    zapProtocol: ZapProtocol = ZapProtocol.YEARN,
    overrides: CallOverrides = {}
  ): Promise<TransactionResponse> {
    if (options.slippage === undefined) {
      throw new SdkError("zap operations should have a slippage set");
    }

    const zapInParams = await this.yearn.services.zapper.zapIn(
      account,
      token,
      amount,
      vault,
      "0",
      options.slippage,
      false,
      zapProtocol
    );

    const transactionRequest: TransactionRequest = {
      to: zapInParams.to,
      from: zapInParams.from,
      data: zapInParams.data,
      value: BigNumber.from(zapInParams.value),
      gasLimit: BigNumber.from(zapInParams.gas)
    };

    return this.executeZapperTransaction(transactionRequest, overrides, BigNumber.from(zapInParams.gasPrice), signer);
  }

  private async executeZapperTransaction(
    transactionRequest: TransactionRequest,
    overrides: CallOverrides,
    fallbackGasPrice: BigNumber,
    signer: JsonRpcSigner
  ): Promise<TransactionResponse> {
    try {
      const combinedParams = { ...transactionRequest, ...overrides };
      combinedParams.gasPrice = undefined;
      return await signer.sendTransaction(combinedParams);
    } catch (error) {
      if ((error as any).code === -32602) {
        const combinedParams = { ...transactionRequest, ...overrides };
        combinedParams.maxFeePerGas = undefined;
        combinedParams.maxPriorityFeePerGas = undefined;
        combinedParams.gasPrice = overrides.gasPrice || fallbackGasPrice;
        return await signer.sendTransaction(combinedParams);
      }

      throw error;
    }
  }

  private async executeVaultContractTransaction(
    makeTransaction: (overrides: CallOverrides) => Promise<TransactionResponse>,
    overrides: CallOverrides
  ): Promise<TransactionResponse> {
    const originalGasPrice = overrides.gasPrice;
    try {
      overrides.gasPrice = undefined;
      const tx = await makeTransaction(overrides);
      return tx;
    } catch (error) {
      if ((error as any).code === -32602) {
        overrides.maxFeePerGas = undefined;
        overrides.maxPriorityFeePerGas = undefined;
        overrides.gasPrice = originalGasPrice;
        const tx = await makeTransaction(overrides);
        return tx;
      }

      throw error;
    }
  }

  private fillTokenMetadataOverrides(token: Token, overrides: TokenMetadata) {
    if (overrides.tokenIconOverride) {
      token.icon = overrides.tokenIconOverride;
    }
    if (overrides.tokenSymbolOverride) {
      token.symbol = overrides.tokenSymbolOverride;
    }
    if (overrides.tokenNameOverride) {
      token.name = overrides.tokenNameOverride;
    }
  }

  private fillMetadataOverrides(dynamic: VaultDynamic, overrides: VaultMetadataOverrides) {
    if (overrides.displayName) {
      dynamic.metadata.displayName = overrides.displayName;
    }
    if (overrides.vaultSymbolOverride) {
      dynamic.metadata.symbol = overrides.vaultSymbolOverride;
    }
    if (overrides.vaultIconOverride) {
      dynamic.metadata.displayIcon = overrides.vaultIconOverride;
    }
    if (overrides.apyTypeOverride) {
      if (!dynamic.metadata.apy) {
        dynamic.metadata.apy = this.makeEmptyApy();
      }
      dynamic.metadata.apy.type = overrides.apyTypeOverride;
    }
    if (overrides.apyOverride) {
      if (!dynamic.metadata.apy) {
        dynamic.metadata.apy = this.makeEmptyApy();
      }
      dynamic.metadata.apy.net_apy = overrides.apyOverride;
      dynamic.metadata.apy.type = "override";
    }

    dynamic.metadata.depositsDisabled = overrides.depositsDisabled;
    dynamic.metadata.withdrawalsDisabled = overrides.withdrawalsDisabled;
    dynamic.metadata.allowZapIn = overrides.allowZapIn;
    dynamic.metadata.allowZapOut = overrides.allowZapOut;
    dynamic.metadata.migrationContract = overrides.migrationContract;
    dynamic.metadata.migrationTargetVault = overrides.migrationTargetVault;
    dynamic.metadata.vaultNameOverride = overrides.vaultNameOverride;
    dynamic.metadata.vaultDetailPageAssets = overrides.vaultDetailPageAssets;

    dynamic.metadata.hideIfNoDeposits =
      dynamic.metadata.emergencyShutdown || overrides.retired || overrides.migrationAvailable || false;
    dynamic.metadata.migrationAvailable = dynamic.metadata.migrationAvailable || overrides.migrationAvailable || false;
  }

  private makeEmptyApy(): Apy {
    const apy: Apy = {
      type: "manual_override",
      gross_apr: 0,
      net_apy: 0,
      fees: { performance: null, withdrawal: null, management: null, keep_crv: null, cvx_keep_crv: null },
      points: null,
      composite: null
    };
    return apy;
  }
}
