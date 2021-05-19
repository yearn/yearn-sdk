import { BigNumber } from "bignumber.js";
import { getAddress } from "@ethersproject/address";

import { ProtocolEarnings } from "../services/subgraph/apollo/generated/ProtocolEarnings";
import { VaultEarnings, VaultEarningsVariables } from "../services/subgraph/apollo/generated/VaultEarnings";
import {
  ACCOUNT_EARNINGS,
  ASSET_HISTORIC_EARNINGS,
  PROTOCOL_EARNINGS,
  VAULT_EARNINGS
} from "../services/subgraph/apollo/queries";

import { ChainId } from "../chain";
import { Reader } from "../common";
import { Address, SdkError, TokenAmount, Usdc } from "../types";
import {
  AccountEarnings as AccountEarningsQuery,
  AccountEarningsVariables as AccountEarningsQueryVariables
} from "../services/subgraph/apollo/generated/AccountEarnings";
import {
  AssetHistoricEarnings as AssetHistoricEarningsQuery,
  AssetHistoricEarningsVariables as AssetHistoricEarningsQueryVariables
} from "../services/subgraph/apollo/generated/AssetHistoricEarnings";

const OneHundredMillionUsdc = new BigNumber(10 ** 14); // 1e8 (100M) * 1e6 (Usdc decimals)
const BigZero = new BigNumber(0);

export interface AccountSummary {
  accountId: Address;
  aggregatedApy: number;
  totalDepositedUsdc: Usdc;
  totalEarningsUsdc: Usdc;
  projectedDailyEarningsUsdc: Usdc;
}

export interface AccountAssetPosition {
  accountAddress: Address;
  assetAddress: Address;
  tokenAddress: Address;
  balance: TokenAmount;
  earnings: TokenAmount;
  roi: number;
}

export interface AssetEarnings extends TokenAmount {
  tokenAddress: Address;
  assetAddress: Address;
}

export interface AssetDayData {
  earnings: TokenAmount;
  date: number;
}

export interface AssetHistoricEarnings {
  assetAddress: Address;
  decimals: number;
  dayData: AssetDayData[];
}

export class EarningsReader<C extends ChainId> extends Reader<C> {
  async protocolEarnings(): Promise<String> {
    const response = await this.yearn.services.subgraph.client.query<ProtocolEarnings>({
      query: PROTOCOL_EARNINGS
    });

    let result = BigZero;
    for (const vault of response.data.vaults) {
      if (vault.latestUpdate === null) {
        continue;
      }
      const returnsGenerated = new BigNumber(vault.latestUpdate.returnsGenerated);
      const earningsUsdc = await this.tokensValueInUsdc(returnsGenerated, vault.token.id, vault.token.decimals);
      // FIXME: some results are negative, and some are too large to be realistically possible.
      // This is due to problems with the subgraph and should be fixed there:
      // https://github.com/yearn/yearn-vaults-v2-subgraph/issues/60
      if (earningsUsdc.gt(BigZero) && earningsUsdc.lt(OneHundredMillionUsdc)) {
        result = result.plus(earningsUsdc);
      }
    }

    return result.toFixed(0);
  }

  async assetEarnings(assetAddress: Address): Promise<AssetEarnings> {
    const response = await this.yearn.services.subgraph.client.query<VaultEarnings, VaultEarningsVariables>({
      query: VAULT_EARNINGS,
      variables: {
        vault: assetAddress
      }
    });

    const vault = response.data.vault;

    if (!vault) {
      throw new SdkError(`failed to find asset with address ${assetAddress}`);
    }

    const returnsGenerated = new BigNumber(vault.latestUpdate?.returnsGenerated || 0);
    const earningsUsdc = await this.tokensValueInUsdc(returnsGenerated, vault.token.id, vault.token.decimals);
    return {
      assetAddress: getAddress(assetAddress), // addresses from subgraph are not checksummed
      amount: returnsGenerated.toFixed(0),
      amountUsdc: earningsUsdc.toFixed(0),
      tokenAddress: getAddress(vault.token.id)
    };
  }

  async accountAssetPositions(accountAddress: Address): Promise<AccountAssetPosition[]> {
    const response = await this.yearn.services.subgraph.client.query<
      AccountEarningsQuery,
      AccountEarningsQueryVariables
    >({
      query: ACCOUNT_EARNINGS,
      variables: {
        id: accountAddress
      }
    });

    const account = response.data.account;

    if (!account) {
      throw new SdkError(`failed to find account address ${accountAddress}`);
    }

    return await Promise.all(
      account.vaultPositions.map(async assetPosition => {
        const balanceTokens = new BigNumber(assetPosition.balanceShares)
          .multipliedBy(new BigNumber(assetPosition.vault.latestUpdate?.pricePerShare || 0))
          .div(10 ** assetPosition.token.decimals);

        const deposits = assetPosition.updates
          .map(update => new BigNumber(update.deposits))
          .reduce((sum, value) => sum.plus(value));
        const withdrawals = assetPosition.updates
          .map(update => new BigNumber(update.withdrawals))
          .reduce((sum, value) => sum.plus(value));
        const tokensReceived = assetPosition.updates
          .map(update => new BigNumber(update.tokensReceived))
          .reduce((sum, value) => sum.plus(value));
        const tokensSent = assetPosition.updates
          .map(update => new BigNumber(update.tokensSent))
          .reduce((sum, value) => sum.plus(value));

        const positiveTokens = balanceTokens.plus(withdrawals).plus(tokensSent);
        const negativeTokens = deposits.plus(tokensReceived);
        const earningsTokens = positiveTokens.minus(negativeTokens);

        const earningsUsdc = await this.tokensValueInUsdc(
          earningsTokens,
          assetPosition.token.id,
          assetPosition.token.decimals
        );

        const earnings: TokenAmount = {
          amount: earningsTokens.toFixed(0),
          amountUsdc: earningsUsdc.toFixed(0)
        };

        const balanceUsdc = await this.tokensValueInUsdc(
          balanceTokens,
          assetPosition.token.id,
          assetPosition.token.decimals
        );

        const balance: TokenAmount = {
          amount: balanceTokens.toFixed(0),
          amountUsdc: balanceUsdc.toFixed(0)
        };

        const roi =
          balanceTokens.minus(earningsTokens) !== BigZero
            ? earningsTokens.div(balanceTokens.minus(earningsTokens)).toNumber()
            : 0;

        return {
          earnings: earnings,
          balance: balance,
          accountAddress: getAddress(accountAddress), // addresses from subgraph are not checksummed
          tokenAddress: getAddress(assetPosition.token.id),
          assetAddress: getAddress(assetPosition.vault.id),
          roi: roi
        };
      })
    );
  }

  async accountSummary(accountAddress: Address): Promise<AccountSummary> {
    const accountAssetPositions = await this.accountAssetPositions(accountAddress);

    const totalDepositedUsdc = accountAssetPositions
      .map(position => new BigNumber(position.balance.amountUsdc))
      .reduce((sum, next) => sum.plus(next));

    const assetAddresses = accountAssetPositions.map(position => position.assetAddress);
    const apys = await this.yearn.services.vision.apy(assetAddresses);

    const aggregatedApy: BigNumber = accountAssetPositions.reduce((sum: BigNumber, next: AccountAssetPosition) => {
      if (totalDepositedUsdc === BigZero) {
        return sum;
      }
      const apy = apys[next.assetAddress]?.recommended;
      if (!apy) {
        return sum;
      }
      const ratio = new BigNumber(next.balance.amountUsdc).dividedBy(new BigNumber(totalDepositedUsdc));
      const weightedApy = ratio.multipliedBy(new BigNumber(apy));
      return sum.plus(weightedApy);
    }, BigZero);

    const totalEarningsUsdc = accountAssetPositions
      .map(position => new BigNumber(position.earnings.amountUsdc))
      .reduce((sum, current) => sum.plus(current));

    const projectedDailyEarningsUsdc = aggregatedApy
      .multipliedBy(new BigNumber(totalDepositedUsdc))
      .dividedBy(new BigNumber(365));

    return {
      accountId: accountAddress,
      totalDepositedUsdc: totalDepositedUsdc.toFixed(0),
      totalEarningsUsdc: totalEarningsUsdc.toFixed(0),
      aggregatedApy: aggregatedApy.toNumber(),
      projectedDailyEarningsUsdc: projectedDailyEarningsUsdc.toFixed(0)
    };
  }

  async assetHistoricEarnings(assetAddress: Address, sinceDate: number): Promise<AssetHistoricEarnings> {
    const vault = await this.yearn.services.subgraph.client
      .query<AssetHistoricEarningsQuery, AssetHistoricEarningsQueryVariables>({
        query: ASSET_HISTORIC_EARNINGS,
        variables: {
          id: assetAddress.toLowerCase(),
          sinceDate: sinceDate
        }
      })
      .then(response => response.data.vault);

    if (!vault) {
      throw new SdkError(`failed to find asset with address ${assetAddress}`);
    }

    const dayData = await Promise.all(
      vault.vaultDayData.map(async vaultDayDatum => {
        const amountUsdc = await this.tokensValueInUsdc(
          new BigNumber(vaultDayDatum.dayReturnsGenerated),
          getAddress(vault.token.id),
          vault.token.decimals
        );
        return {
          earnings: {
            amountUsdc: amountUsdc.toFixed(0),
            amount: vaultDayDatum.dayReturnsGenerated
          },
          date: vaultDayDatum.date
        };
      })
    );

    return {
      decimals: vault.token.decimals,
      assetAddress: assetAddress,
      dayData: dayData
    };
  }

  private async tokensValueInUsdc(tokenAmount: BigNumber, tokenAddress: Address, decimals: number): Promise<BigNumber> {
    const tokenUsdcPrice = await this.yearn.services.oracle.getPriceUsdc(tokenAddress);
    return new BigNumber(tokenUsdcPrice).multipliedBy(tokenAmount).div(10 ** decimals);
  }
}
