import { getAddress } from "@ethersproject/address";
import { BigNumber } from "bignumber.js";

import { CachedFetcher } from "../cache";
import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { convertSecondsMillisOrMicrosToMillis } from "../helpers";
import {
  ACCOUNT_EARNINGS,
  ACCOUNT_HISTORIC_EARNINGS,
  ASSET_HISTORIC_EARNINGS,
  buildAccountEarningsVariables,
  PROTOCOL_EARNINGS,
  VAULT_EARNINGS,
} from "../services/subgraph/queries";
import {
  AccountEarningsResponse,
  AccountHistoricEarningsResponse,
  ProtocolEarningsResponse,
  VaultEarningsResponse,
} from "../services/subgraph/responses";
import { Address, SdkError } from "../types";
import {
  AccountHistoricEarnings,
  AssetEarnings,
  AssetHistoricEarnings,
  EarningsDayData,
  EarningsUserData,
} from "../types/custom/earnings";
import { toBN } from "../utils";

const BigZero = new BigNumber(0);

interface StrategiesResponse {
  latestReport?: {
    totalGain: string;
    totalLoss: string;
  };
}

export class EarningsInterface<C extends ChainId> extends ServiceInterface<C> {
  /**
   * @deprecated
   * Not able to be accurately calculated by the subgraph, this functionality will be removed in a future version
   */
  async protocolEarnings(): Promise<string> {
    const response = await this.yearn.services.subgraph.fetchQuery<ProtocolEarningsResponse>(PROTOCOL_EARNINGS);

    let result = BigZero;

    if (!response?.data || !response.data?.vaults) {
      return result.toFixed(0);
    }

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
    const response = await this.yearn.services.subgraph.fetchQuery<VaultEarningsResponse>(VAULT_EARNINGS, {
      vault: assetAddress,
    });

    if (!response?.data || !response.data?.vault) {
      throw new SdkError(`No asset with address ${assetAddress}`);
    }

    const { vault } = response.data;

    const returnsGenerated = new BigNumber(vault.latestUpdate?.returnsGenerated || 0);
    const earningsUsdc = await this.tokensValueInUsdc(returnsGenerated, vault.token.id, vault.token.decimals);
    return {
      assetAddress: getAddress(assetAddress), // addresses from subgraph are not checksummed
      amount: returnsGenerated.toFixed(0),
      amountUsdc: earningsUsdc.toFixed(0),
      tokenAddress: getAddress(vault.token.id),
    };
  }

  async accountAssetsData(accountAddress: Address): Promise<EarningsUserData> {
    const response = await this.yearn.services.subgraph.fetchQuery<AccountEarningsResponse>(
      ACCOUNT_EARNINGS,
      buildAccountEarningsVariables(accountAddress)
    );

    const account = response?.data?.account;

    if (!account) {
      return { earnings: "0", holdings: "0", earningsAssetData: [], grossApy: 0, estimatedYearlyYield: "0" };
    }

    const assetsData = await Promise.all(
      account.vaultPositions.map(async (assetPosition) => {
        const balanceTokens = new BigNumber(assetPosition.balanceShares)
          .multipliedBy(new BigNumber(assetPosition.vault.latestUpdate?.pricePerShare || 0))
          .div(10 ** assetPosition.token.decimals);

        const { deposits, withdrawals, tokensReceived, tokensSent } = assetPosition.updates.reduce(
          ({ deposits, withdrawals, tokensReceived, tokensSent }, current) => ({
            deposits: deposits.plus(new BigNumber(current.deposits)),
            withdrawals: withdrawals.plus(new BigNumber(current.withdrawals)),
            tokensReceived: tokensReceived.plus(new BigNumber(current.tokensReceived)),
            tokensSent: tokensSent.plus(new BigNumber(current.tokensSent)),
          }),
          {
            deposits: BigZero,
            withdrawals: BigZero,
            tokensReceived: BigZero,
            tokensSent: BigZero,
          }
        );

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

        return {
          assetAddress: getAddress(assetPosition.vault.id),
          balanceUsdc,
          earned: earningsUsdc.toFixed(0),
        };
      })
    );

    const assetAddresses = assetsData.map((assetData) => assetData.assetAddress);
    const apys = await this.yearn.services.vision.apy(assetAddresses);

    const totalEarnings = assetsData
      .map((datum) => new BigNumber(datum.earned))
      .reduce((sum, value) => sum.plus(value));
    const holdings = assetsData
      .map((datum) => new BigNumber(datum.balanceUsdc))
      .reduce((sum, value) => sum.plus(value));

    const grossApy = holdings.isEqualTo(BigZero)
      ? BigZero
      : assetsData
          .map((datum) => {
            const isNew = apys[datum.assetAddress]?.type === "new";
            const apy = (!isNew && apys[datum.assetAddress]?.net_apy || 0)
            return new BigNumber(apy).times(datum.balanceUsdc).div(holdings);
          })
          .reduce((sum, value) => sum.plus(value));

    const estimatedYearlyYield = grossApy.multipliedBy(holdings);

    const earningsAssetData = assetsData.map((datum) => {
      return {
        assetAddress: datum.assetAddress,
        earned: datum.earned,
      };
    });

    return {
      earnings: BigNumber.max(totalEarnings, 0).toFixed(0),
      holdings: BigNumber.max(holdings, 0).toFixed(0),
      grossApy: grossApy.toNumber(),
      estimatedYearlyYield: BigNumber.max(estimatedYearlyYield, 0).toFixed(0),
      earningsAssetData: earningsAssetData,
    };
  }

  private assetHistoricEarningsCache = new CachedFetcher<AssetHistoricEarnings[]>(
    "vaults/earnings/get",
    this.ctx,
    this.chainId
  );

  async assetsHistoricEarnings(fromDaysAgo = 30): Promise<AssetHistoricEarnings[]> {
    if (fromDaysAgo === 30) {
      const cached = await this.assetHistoricEarningsCache.fetch();
      if (cached) {
        return cached;
      }
    }

    const assetsStatic = await this.yearn.services.lens.adapters.vaults.v2.assetsStatic();
    const assetAddresses = assetsStatic.map((asset) => asset.address);

    const latestBlockNumber = await this.ctx.provider.read.getBlockNumber();

    const resolvedPromises = await Promise.allSettled(
      assetAddresses.map(async (address) => this.assetHistoricEarnings(address, fromDaysAgo, latestBlockNumber))
    );

    const result = [];

    for (const resolvedPromise of resolvedPromises) {
      if (resolvedPromise.status === "fulfilled") {
        result.push(resolvedPromise.value);
      }
    }

    return result;
  }

  async assetHistoricEarnings(
    vault: Address,
    fromDaysAgo: number,
    latestBlockNumber?: number
  ): Promise<AssetHistoricEarnings> {
    let blockNumber = latestBlockNumber ?? (await this.ctx.provider.read.getBlockNumber());

    blockNumber -= this.blockOffset(); // subgraph might be slightly behind latest block

    const blocks = Array.from(Array(fromDaysAgo).keys())
      .reverse()
      .map((day) => blockNumber - day * this.blocksPerDay());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await this.yearn.services.subgraph.fetchQuery<any>(ASSET_HISTORIC_EARNINGS(blocks), {
      id: vault,
    });

    const labels = blocks.map((block) => `block_${block}`);

    const token = data.vault.token.id as Address;
    const priceUsdc = await this.yearn.services.oracle.getPriceUsdc(token).then((price) => new BigNumber(price));

    const earningsDayData = labels.map((label) => {
      const strategies: StrategiesResponse[] = data[label].strategies;

      const { totalGain, totalLoss } = strategies.reduce(
        ({ totalGain, totalLoss }, { latestReport }) => {
          if (latestReport) {
            totalGain = totalGain.plus(toBN(latestReport.totalGain));
            totalLoss = totalLoss.plus(toBN(latestReport.totalLoss));
          }
          return { totalGain, totalLoss };
        },
        { totalGain: toBN(0), totalLoss: toBN(0) }
      );

      const amountEarnt = totalGain.minus(totalLoss);

      const amountUsdc = priceUsdc.multipliedBy(amountEarnt).dividedBy(toBN(10).pow(toBN(data.vault.token.decimals)));

      const dayData: EarningsDayData = {
        earnings: {
          amountUsdc: amountUsdc.toFixed(0),
          amount: amountEarnt.toFixed(0),
        },
        date: new Date(convertSecondsMillisOrMicrosToMillis(data[label].vaultDayData[0].timestamp)).toJSON(),
      };

      return dayData;
    });

    return {
      assetAddress: vault,
      dayData: earningsDayData,
      decimals: data.vault.token.decimals,
    };
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

    const response = await this.yearn.services.subgraph.fetchQuery<AccountHistoricEarningsResponse>(
      ACCOUNT_HISTORIC_EARNINGS,
      {
        id: accountAddress,
        shareToken: shareTokenAddress,
        fromDate: this.getDate(fromDaysAgo).getTime().toString(),
        toDate: this.getDate(toDaysAgo || 0)
          .getTime()
          .toString(),
      }
    );

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

    const snapshotTimeline: AccountSnapshot[] = [];

    const updates = vaultPositions
      .flatMap((vaultPosition) => vaultPosition.updates)
      .sort((lhs, rhs) => {
        return convertSecondsMillisOrMicrosToMillis(+lhs.timestamp - +rhs.timestamp);
      });

    for (const [index, vaultPositionUpdate] of updates.entries()) {
      if (index === 0) {
        const snapshot: AccountSnapshot = {
          startDate: new Date(0),
          endDate: new Date(convertSecondsMillisOrMicrosToMillis(vaultPositionUpdate.timestamp)),
          deposits: new BigNumber(vaultPositionUpdate.deposits),
          withdrawals: new BigNumber(vaultPositionUpdate.withdrawals),
          tokensReceived: new BigNumber(vaultPositionUpdate.tokensReceived),
          tokensSent: new BigNumber(vaultPositionUpdate.tokensSent),
          balanceShares: new BigNumber(vaultPositionUpdate.balanceShares),
        };
        snapshotTimeline.push(snapshot);
      } else {
        const previousSnapshot = snapshotTimeline[index - 1];
        const snapshot: AccountSnapshot = {
          startDate: previousSnapshot.endDate,
          endDate: new Date(convertSecondsMillisOrMicrosToMillis(vaultPositionUpdate.timestamp)),
          deposits: previousSnapshot.deposits.plus(new BigNumber(vaultPositionUpdate.deposits)),
          withdrawals: previousSnapshot.withdrawals.plus(new BigNumber(vaultPositionUpdate.withdrawals)),
          tokensReceived: previousSnapshot.tokensReceived.plus(new BigNumber(vaultPositionUpdate.tokensReceived)),
          tokensSent: previousSnapshot.tokensSent.plus(new BigNumber(vaultPositionUpdate.tokensSent)),
          balanceShares: previousSnapshot.balanceShares.plus(new BigNumber(vaultPositionUpdate.balanceShares)),
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
        balanceShares: lastSnapshot.balanceShares,
      };
      snapshotTimeline.push(snapshot);
    }

    const vaultDayData = vaultPositions[0].vault.vaultDayData;
    const token = vaultPositions[0].token;
    const usdcPrice = await this.yearn.services.oracle.getPriceUsdc(token.id).then((id) => new BigNumber(id));

    const earningsDayData = await Promise.all(
      vaultDayData.map(async (vaultDayDatum) => {
        const date = new Date(convertSecondsMillisOrMicrosToMillis(vaultDayDatum.timestamp));
        const snapshot = snapshotTimeline.find((snapshot) => date >= snapshot.startDate && date < snapshot.endDate);
        if (snapshot) {
          const balanceTokens = snapshot.balanceShares
            .multipliedBy(new BigNumber(vaultDayDatum.pricePerShare))
            .dividedBy(new BigNumber(10 ** token.decimals));
          const positives = balanceTokens.plus(snapshot.withdrawals).plus(snapshot.tokensSent);
          const negatives = snapshot.deposits.plus(snapshot.tokensReceived);
          const earnings = positives.minus(negatives);

          const amountUsdc = usdcPrice.multipliedBy(earnings).dividedBy(new BigNumber(10).pow(token.decimals));

          return {
            earnings: {
              amount: earnings.toFixed(0),
              amountUsdc: amountUsdc.toFixed(0),
            },
            date: date.toJSON(),
          };
        } else {
          return {
            earnings: {
              amount: "0",
              amountUsdc: "0",
            },
            date: date.toJSON(),
          };
        }
      })
    );

    return {
      accountAddress: accountAddress,
      shareTokenAddress: shareTokenAddress,
      decimals: token.decimals,
      dayData: earningsDayData,
    };
  }

  private async tokensValueInUsdc(tokenAmount: BigNumber, tokenAddress: Address, decimals: number): Promise<BigNumber> {
    const tokenUsdcPrice = await this.yearn.services.oracle.getPriceUsdc(tokenAddress);
    return new BigNumber(tokenUsdcPrice).multipliedBy(tokenAmount).div(10 ** decimals);
  }

  private getDate(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  private blocksPerDay(): number {
    switch (this.chainId) {
      case 1:
      case 1337:
      case 42161:
        return 5760;
      case 250:
        return 86400;
    }
  }

  private blockOffset(): number {
    switch (this.chainId) {
      case 1:
      case 1337:
      case 42161:
        return 100;
      case 250:
        return 1000;
    }
  }
}
