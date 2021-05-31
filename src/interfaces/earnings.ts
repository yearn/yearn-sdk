import { getAddress } from "@ethersproject/address";
import { BigNumber } from "bignumber.js";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import {
  AccountEarnings as AccountEarningsQuery,
  AccountEarningsVariables as AccountEarningsQueryVariables
} from "../services/subgraph/apollo/generated/AccountEarnings";
import {
  AccountHistoricEarnings as AccountHistoricEarningsQuery,
  AccountHistoricEarningsVariables as AccountHistoricEarningsQueryVariables
} from "../services/subgraph/apollo/generated/AccountHistoricEarnings";
import {
  AssetHistoricEarnings as AssetHistoricEarningsQuery,
  AssetHistoricEarningsVariables as AssetHistoricEarningsQueryVariables
} from "../services/subgraph/apollo/generated/AssetHistoricEarnings";
import { ProtocolEarnings } from "../services/subgraph/apollo/generated/ProtocolEarnings";
import { VaultEarnings, VaultEarningsVariables } from "../services/subgraph/apollo/generated/VaultEarnings";
import {
  ACCOUNT_EARNINGS,
  ACCOUNT_HISTORIC_EARNINGS,
  ASSET_HISTORIC_EARNINGS,
  PROTOCOL_EARNINGS,
  VAULT_EARNINGS
} from "../services/subgraph/apollo/queries";
import { Address, SdkError, TokenAmount, Usdc } from "../types";

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

export interface AssetHistoricEarnings extends HistoricEarnings {
  assetAddress: Address;
}

export interface AccountHistoricEarnings extends HistoricEarnings {
  accountAddress: Address;
  shareTokenAddress: Address;
}

export interface HistoricEarnings {
  decimals: number;
  dayData: EarningsDayData[];
}

export interface EarningsDayData {
  earnings: TokenAmount;
  date: number;
}

export class EarningsInterface<C extends ChainId> extends ServiceInterface<C> {
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

  async assetHistoricEarnings(assetAddress: Address, sinceDate: Date): Promise<AssetHistoricEarnings> {
    const vault = await this.yearn.services.subgraph.client
      .query<AssetHistoricEarningsQuery, AssetHistoricEarningsQueryVariables>({
        query: ASSET_HISTORIC_EARNINGS,
        variables: {
          id: assetAddress.toLowerCase(),
          sinceDate: sinceDate.getTime().toString()
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

  async accountHistoricEarnings(
    accountAddress: Address,
    shareTokenAddress: Address,
    sinceDate: Date
  ): Promise<AccountHistoricEarnings> {
    const vaultPositions = await this.yearn.services.subgraph.client
      .query<AccountHistoricEarningsQuery, AccountHistoricEarningsQueryVariables>({
        query: ACCOUNT_HISTORIC_EARNINGS,
        variables: {
          id: accountAddress.toLowerCase(),
          shareToken: shareTokenAddress.toLowerCase(),
          sinceDate: (sinceDate.getTime() / 1000).toString()
        }
      })
      .then(response => response.data.account?.vaultPositions);

    if (!vaultPositions) {
      throw new SdkError(`failed to find account with address ${accountAddress}`);
    }

    interface AccountSnapshot {
      startDate: number;
      endDate: number;
      deposits: BigNumber;
      withdrawals: BigNumber;
      tokensReceived: BigNumber;
      tokensSent: BigNumber;
      balanceShares: BigNumber;
    }

    let snapshotTimeline: AccountSnapshot[] = [];

    const updates = vaultPositions
      .flatMap(vaultPosition => vaultPosition.updates)
      .sort((lhs, rhs) => {
        return +lhs.timestamp - +rhs.timestamp;
      });

    for (const [index, vaultPositionUpdate] of updates.entries()) {
      if (index === 0) {
        const snapshot: AccountSnapshot = {
          startDate: new Date(0).getTime(),
          endDate: +vaultPositionUpdate.timestamp,
          deposits: new BigNumber(vaultPositionUpdate.deposits),
          withdrawals: new BigNumber(vaultPositionUpdate.withdrawals),
          tokensReceived: new BigNumber(vaultPositionUpdate.tokensReceived),
          tokensSent: new BigNumber(vaultPositionUpdate.tokensSent),
          balanceShares: new BigNumber(vaultPositionUpdate.balanceShares)
        };
        snapshotTimeline.push(snapshot);
      } else {
        const previousSnapshot = snapshotTimeline[index - 1];
        const snapshot: AccountSnapshot = {
          startDate: previousSnapshot.endDate,
          endDate: +vaultPositionUpdate.timestamp,
          deposits: previousSnapshot.deposits.plus(new BigNumber(vaultPositionUpdate.deposits)),
          withdrawals: previousSnapshot.withdrawals.plus(new BigNumber(vaultPositionUpdate.withdrawals)),
          tokensReceived: previousSnapshot.tokensReceived.plus(new BigNumber(vaultPositionUpdate.tokensReceived)),
          tokensSent: previousSnapshot.tokensSent.plus(new BigNumber(vaultPositionUpdate.tokensSent)),
          balanceShares: previousSnapshot.balanceShares.plus(new BigNumber(vaultPositionUpdate.balanceShares))
        };
        snapshotTimeline.push(snapshot);
      }
    }

    if (snapshotTimeline.length > 0) {
      const lastSnapshot = snapshotTimeline[snapshotTimeline.length - 1];
      const distantFuture = new Date().setFullYear(3000);
      const snapshot: AccountSnapshot = {
        startDate: lastSnapshot.endDate,
        endDate: distantFuture,
        deposits: lastSnapshot.deposits,
        withdrawals: lastSnapshot.withdrawals,
        tokensReceived: lastSnapshot.tokensReceived,
        tokensSent: lastSnapshot.tokensSent,
        balanceShares: lastSnapshot.balanceShares
      };
      snapshotTimeline.push(snapshot);
    }

    const vaultDayData = vaultPositions[0].vault.vaultDayData;
    const token = vaultPositions[0].token;

    const earningsDayData = await Promise.all(
      vaultDayData.map(async vaultDayDatum => {
        const date = vaultDayDatum.date * 1000;
        const snapshot = snapshotTimeline.find(snapshot => date >= snapshot.startDate && date < snapshot.endDate);
        if (snapshot) {
          const balanceTokens = snapshot.balanceShares
            .multipliedBy(new BigNumber(vaultDayDatum.pricePerShare))
            .dividedBy(new BigNumber(10 ** token.decimals));
          let positives = balanceTokens.plus(snapshot.withdrawals).plus(snapshot.tokensSent);
          let negatives = snapshot.deposits.plus(snapshot.tokensReceived);
          let earnings = positives.minus(negatives);

          const amountUsdc = await this.tokensValueInUsdc(earnings, token.id, token.decimals);

          return {
            earnings: {
              amount: earnings.toFixed(0),
              amountUsdc: amountUsdc.toFixed(0)
            },
            date: date
          };
        } else {
          return {
            earnings: {
              amount: "0",
              amountUsdc: "0"
            },
            date: date
          };
        }
      })
    );

    return {
      accountAddress: accountAddress,
      shareTokenAddress: shareTokenAddress,
      decimals: token.decimals,
      dayData: earningsDayData
    };
  }

  private async tokensValueInUsdc(tokenAmount: BigNumber, tokenAddress: Address, decimals: number): Promise<BigNumber> {
    const tokenUsdcPrice = await this.yearn.services.oracle.getPriceUsdc(tokenAddress);
    return new BigNumber(tokenUsdcPrice).multipliedBy(tokenAmount).div(10 ** decimals);
  }
}
