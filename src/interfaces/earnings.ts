import { getAddress } from "@ethersproject/address";
import { BigNumber } from "bignumber.js";

import { CachedFetcher } from "../cache";
import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import {
  ACCOUNT_EARNINGS,
  ACCOUNT_HISTORIC_EARNINGS,
  ASSET_HISTORIC_EARNINGS,
  PROTOCOL_EARNINGS,
  VAULT_EARNINGS
} from "../services/subgraph/queries";
import {
  AccountEarningsResponse,
  AccountHistoricEarningsResponse,
  AssetHistoricEarningsResponse,
  ProtocolEarningsResponse,
  VaultEarningsResponse
} from "../services/subgraph/responses";
import { Address, SdkError } from "../types";
import {
  AccountHistoricEarnings,
  AssetEarnings,
  AssetHistoricEarnings,
  EarningsUserData
} from "../types/custom/earnings";

const BigZero = new BigNumber(0);

export class EarningsInterface<C extends ChainId> extends ServiceInterface<C> {
  async protocolEarnings(): Promise<String> {
    const response = (await this.yearn.services.subgraph.fetchQuery(PROTOCOL_EARNINGS)) as ProtocolEarningsResponse;

    let result = BigZero;
    for (const vault of response.data.vaults) {
      if (!vault.latestUpdate) {
        continue;
      }
      const returnsGenerated = new BigNumber(vault.latestUpdate.returnsGenerated);
      const earningsUsdc = await this.tokensValueInUsdc(returnsGenerated, vault.token.id, vault.token.decimals);
      result = result.plus(earningsUsdc);
    }

    return result.toFixed(0);
  }

  async assetEarnings(assetAddress: Address): Promise<AssetEarnings> {
    const response = (await this.yearn.services.subgraph.fetchQuery(VAULT_EARNINGS, {
      vault: assetAddress
    })) as VaultEarningsResponse;

    const vault = response.data.vault;

    if (!vault) {
      throw new SdkError(`No asset with address ${assetAddress}`);
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

  async accountAssetsData(accountAddress: Address): Promise<EarningsUserData> {
    const response = (await this.yearn.services.subgraph.fetchQuery(ACCOUNT_EARNINGS, {
      id: accountAddress
    })) as AccountEarningsResponse;

    const account = response.data.account;

    if (!account) {
      return { earnings: "0", holdings: "0", earningsAssetData: [], grossApy: 0, estimatedYearlyYield: "0" };
    }

    const assetAddresses = account.vaultPositions.map(position => getAddress(position.vault.id));
    const apys = await this.yearn.services.vision.apy(assetAddresses);

    const assetsData = await Promise.all(
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

        const balanceUsdc = await this.tokensValueInUsdc(
          balanceTokens,
          assetPosition.token.id,
          assetPosition.token.decimals
        );

        const assetAddress = getAddress(assetPosition.vault.id);

        return {
          assetAddress: assetAddress,
          balanceUsdc: balanceUsdc,
          earned: earningsUsdc.toFixed(0)
        };
      })
    );

    const totalEarnings = assetsData.map(datum => new BigNumber(datum.earned)).reduce((sum, value) => sum.plus(value));
    const holdings = assetsData.map(datum => new BigNumber(datum.balanceUsdc)).reduce((sum, value) => sum.plus(value));

    const grossApy = holdings.isEqualTo(BigZero)
      ? BigZero
      : assetsData
          .map(datum => {
            const apy = apys[datum.assetAddress]?.net_apy || 0;
            return new BigNumber(apy).times(datum.balanceUsdc).div(holdings);
          })
          .reduce((sum, value) => sum.plus(value));

    const estimatedYearlyYield = grossApy.multipliedBy(holdings);

    const earningsAssetData = assetsData.map(datum => {
      return {
        assetAddress: datum.assetAddress,
        earned: datum.earned
      };
    });

    return {
      earnings: BigNumber.max(totalEarnings, 0).toFixed(0),
      holdings: BigNumber.max(holdings, 0).toFixed(0),
      grossApy: grossApy.toNumber(),
      estimatedYearlyYield: BigNumber.max(estimatedYearlyYield, 0).toFixed(0),
      earningsAssetData: earningsAssetData
    };
  }

  private assetHistoricEarningsCache = new CachedFetcher<AssetHistoricEarnings[]>(
    "vaults/earnings/get",
    this.ctx,
    this.chainId
  );

  async assetsHistoricEarnings(
    assetAddresses?: Address[],
    fromDaysAgo: number = 30,
    toDaysAgo?: number
  ): Promise<AssetHistoricEarnings[]> {
    if (fromDaysAgo === 30 && !toDaysAgo && !assetAddresses) {
      const cached = await this.assetHistoricEarningsCache.fetch();
      if (cached) {
        return cached;
      }
    }

    if (toDaysAgo && toDaysAgo > fromDaysAgo) {
      throw new SdkError("fromDaysAgo must be greater than toDaysAgo");
    }

    if (fromDaysAgo < 0) {
      throw new SdkError("fromDays ago must be positive");
    }

    if (toDaysAgo && toDaysAgo < 0) {
      throw new SdkError("toDays ago must be positive");
    }

    if (!assetAddresses) {
      const assetsStatic = await this.yearn.services.lens.adapters.vaults.v2.assetsStatic();
      assetAddresses = assetsStatic.map(asset => asset.address);
    }

    const response = (await this.yearn.services.subgraph.fetchQuery(ASSET_HISTORIC_EARNINGS, {
      ids: assetAddresses,
      fromDate: this.getDate(fromDaysAgo)
        .getTime()
        .toString(),
      toDate: this.getDate(toDaysAgo || 0)
        .getTime()
        .toString()
    })) as AssetHistoricEarningsResponse;

    return response.data.vaults.map(vault => {
      const dayData = vault.vaultDayData.map(vaultDayDatum => {
        const amountUsdc = new BigNumber(vaultDayDatum.tokenPriceUSDC)
          .multipliedBy(new BigNumber(vaultDayDatum.totalReturnsGenerated))
          .dividedBy(new BigNumber(10).pow(new BigNumber(vault.token.decimals)));

        return {
          earnings: {
            amountUsdc: amountUsdc.toFixed(0),
            amount: vaultDayDatum.totalReturnsGenerated
          },
          date: new Date(+vaultDayDatum.timestamp)
        };
      });

      return {
        decimals: vault.token.decimals,
        assetAddress: getAddress(vault.id),
        dayData: dayData
      };
    });
  }

  async accountHistoricEarnings(
    accountAddress: Address,
    shareTokenAddress: Address,
    fromDaysAgo: number,
    toDaysAgo?: number
  ): Promise<AccountHistoricEarnings> {
    if (toDaysAgo && toDaysAgo > fromDaysAgo) {
      throw new SdkError("fromDaysAgo must be greater than toDaysAgo");
    }

    const response = (await this.yearn.services.subgraph.fetchQuery(ACCOUNT_HISTORIC_EARNINGS, {
      id: accountAddress,
      shareToken: shareTokenAddress,
      fromDate: this.getDate(fromDaysAgo)
        .getTime()
        .toString(),
      toDate: this.getDate(toDaysAgo || 0)
        .getTime()
        .toString()
    })) as AccountHistoricEarningsResponse;

    const vaultPositions = response.data.account?.vaultPositions;

    if (!vaultPositions) {
      throw new SdkError(`No account with address ${accountAddress}`);
    }

    interface AccountSnapshot {
      startDate: Date;
      endDate: Date;
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
          startDate: new Date(0),
          endDate: new Date(+vaultPositionUpdate.timestamp),
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
          endDate: new Date(+vaultPositionUpdate.timestamp),
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
        endDate: new Date(distantFuture),
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
        const date = new Date(+vaultDayDatum.timestamp);
        const snapshot = snapshotTimeline.find(snapshot => date >= snapshot.startDate && date < snapshot.endDate);
        if (snapshot) {
          const balanceTokens = snapshot.balanceShares
            .multipliedBy(new BigNumber(vaultDayDatum.pricePerShare))
            .dividedBy(new BigNumber(10 ** token.decimals));
          let positives = balanceTokens.plus(snapshot.withdrawals).plus(snapshot.tokensSent);
          let negatives = snapshot.deposits.plus(snapshot.tokensReceived);
          let earnings = positives.minus(negatives);

          const amountUsdc = new BigNumber(vaultDayDatum.tokenPriceUSDC)
            .multipliedBy(earnings)
            .dividedBy(token.decimals);

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

  private getDate(daysAgo: number) {
    let date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }
}
