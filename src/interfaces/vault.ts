import { BigNumber } from "@ethersproject/bignumber";
import { CallOverrides, Contract } from "@ethersproject/contracts";
import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import { JsonRpcSigner } from "@ethersproject/providers";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress, WethAddress } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import {
  Address,
  Balance,
  DepositOptions,
  Integer,
  SdkError,
  Token,
  VaultDynamic,
  VaultStatic,
  VaultsUserSummary,
  VaultUserMetadata,
  WithdrawOptions,
  ZapProtocol
} from "../types";
import { Position, Vault } from "../types";

const VaultAbi = ["function deposit(uint256 amount) public", "function withdraw(uint256 amount) public"];
const VaultV1Abi = VaultAbi.concat(["function depositETH(uint256 amount) payable public"]);
// const VaultV2Abi = VaultAbi.concat([]);

export class VaultInterface<T extends ChainId> extends ServiceInterface<T> {
  /**
   * Get all yearn vaults.
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async get(addresses?: Address[], overrides?: CallOverrides): Promise<Vault[]> {
    const assetsStatic = await this.getStatic(addresses, overrides);
    const assetsDynamic = await this.getDynamic(addresses, overrides);

    const strategiesMetadata = await this.yearn.strategies.vaultsStrategiesMetadata(
      assetsDynamic.map(asset => asset.address)
    );
    let assetsHistoricEarnings = await this.yearn.earnings.assetsHistoricEarnings().catch(error => {
      console.error(error);
      return Promise.resolve([]);
    });

    const assets = new Array<Vault>();
    for (const asset of assetsStatic) {
      const dynamic = assetsDynamic.find(({ address }) => asset.address === address);
      if (!dynamic) {
        throw new SdkError(`Dynamic asset does not exist for ${asset.address}`);
      }
      dynamic.metadata.displayName = dynamic.metadata.displayName || asset.name;
      dynamic.metadata.strategies = strategiesMetadata.find(metadata => metadata.vaultAddress === asset.address);
      dynamic.metadata.historicEarnings = assetsHistoricEarnings.find(
        earnings => earnings.assetAddress === asset.address
      )?.dayData;
      assets.push({ ...asset, ...dynamic });
    }
    return assets;
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
  async getDynamic(addresses?: Address[], overrides?: CallOverrides): Promise<VaultDynamic[]> {
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        const data = await adapter.assetsDynamic(addresses, overrides);
        const assetsApy = await this.yearn.services.vision.apy(data.map(dynamic => dynamic.address));
        return data.map(dynamic => {
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
      adapters.map(adapter => {
        return adapter.positionsOf(address, addresses, overrides);
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
   * @param addresses
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
    const adapters = Object.values(this.yearn.services.lens.adapters.vaults);
    return await Promise.all(
      adapters.map(async adapter => {
        const tokenAddresses = await adapter.tokens(overrides);
        const tokens = await this.yearn.services.helper.tokens(tokenAddresses, overrides);
        const icons = this.yearn.services.asset.icon(tokenAddresses.concat(EthAddress));
        return Promise.all(
          tokens.map(async token => ({
            ...token,
            // @notice weird icon fix related to the way yearn-assets handles tokens
            icon: icons[token.address === WethAddress ? EthAddress : token.address],
            supported: {},
            priceUsdc: await this.yearn.services.oracle.getPriceUsdc(token.address, overrides),
            metadata: await this.yearn.services.meta.token(token.address)
          }))
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
      return this.zapIn(vault, token, amount, account, signer, options, ZapProtocol.PICKLE);
    }

    const [vaultRef] = await this.getStatic([vault], overrides);
    if (vaultRef.token === token) {
      if (token === EthAddress) {
        if (vaultRef.typeId === "VAULT_V1") {
          const vaultContract = new Contract(vault, VaultV1Abi, signer);
          return vaultContract.depositETH(amount, overrides);
        } else {
          throw new SdkError("deposit:v2:eth not implemented");
        }
      } else {
        const vaultContract = new Contract(vault, VaultAbi, signer);
        return vaultContract.deposit(amount, overrides);
      }
    } else {
      return this.zapIn(vault, token, amount, account, signer, options);
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
      return vaultContract.withdraw(amount, overrides);
    } else {
      if (options.slippage === undefined) {
        throw new SdkError("zap operations should have a slippage set");
      }

      const gasPrice = await this.yearn.services.zapper.gas();
      const gasPriceFastGwei = BigNumber.from(gasPrice.fast).mul(10 ** 9);

      const zapOutParams = await this.yearn.services.zapper.zapOut(
        account,
        token,
        amount,
        vault,
        gasPriceFastGwei.toString(),
        options.slippage
      );

      const transaction: TransactionRequest = {
        to: zapOutParams.to,
        from: zapOutParams.from,
        gasPrice: BigNumber.from(zapOutParams.gasPrice),
        data: zapOutParams.data,
        value: BigNumber.from(zapOutParams.value)
      };

      return signer.sendTransaction(transaction);
    }
  }

  private async zapIn(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    signer: JsonRpcSigner,
    options: DepositOptions = {},
    zapProtocol: ZapProtocol = ZapProtocol.YEARN
  ): Promise<TransactionResponse> {
    if (options.slippage === undefined) {
      throw new SdkError("zap operations should have a slippage set");
    }

    const gasPrice = await this.yearn.services.zapper.gas();
    const gasPriceSpeed = gasPrice[options.gas ?? "fast"];
    const gasPriceFastGwei = BigNumber.from(gasPriceSpeed).mul(10 ** 9);

    const zap = await this.yearn.services.zapper.zapIn(
      account,
      token,
      amount,
      vault,
      gasPriceFastGwei.toString(),
      options.slippage,
      zapProtocol
    );

    const transaction: TransactionRequest = {
      to: zap.to,
      from: zap.from,
      gasPrice: BigNumber.from(zap.gasPrice),
      data: zap.data,
      value: BigNumber.from(zap.value)
    };

    return signer.sendTransaction(transaction);
  }
}
