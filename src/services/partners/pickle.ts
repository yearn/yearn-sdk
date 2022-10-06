import { getAddress } from "@ethersproject/address";
import { BigNumber } from "bignumber.js";

import { Service } from "../../common";
import { usdc } from "../../helpers";
import { Address, Usdc } from "../../types/common";

const HourInMilliseconds = 1000 * 60 * 60;
const PickleApiUrl = "https://api.pickle.finance/prod/protocol/pools";
const PickleApiBackupUrl = "https://f8wgg18t1h.execute-api.us-west-1.amazonaws.com/prod/protocol/pools";

export const PickleJars = [
  "0xCeD67a187b923F0E5ebcc77C7f2F7da20099e378", // yvboost-eth
];

export class PickleService extends Service {
  private pickleJarUSDPrices: Map<Address, BigNumber> = new Map();
  private lastFetchedDate: Date = new Date(0);

  /**
   * Fetches the USD price of a pickle jar token
   * @param jar the address of the jar to fetch
   * @returns the price of the jar token in USD
   */
  async getPriceUsdc(jar: Address): Promise<Usdc> {
    const oneHourAgo = new Date(Date.now() - HourInMilliseconds);
    if (this.lastFetchedDate < oneHourAgo) {
      await this.fetchPickleJarPrices();
    }
    return usdc(this.pickleJarUSDPrices.get(jar)?.toFixed(0) || "0");
  }

  private async fetchPickleJarPrices(): Promise<void> {
    interface JarDatum {
      liquidity_locked: number;
      jarAddress: Address;
      tokens: number;
    }

    const jarData: JarDatum[] = await fetch(PickleApiUrl)
      .catch(() => {
        return fetch(PickleApiBackupUrl);
      })
      .then((res) => res.json());

    this.pickleJarUSDPrices.clear();
    this.lastFetchedDate = new Date();

    const relevantJars = jarData.filter((jar) => PickleJars.includes(getAddress(jar.jarAddress)));

    for (const jarDatum of relevantJars) {
      const usdPrice = new BigNumber(jarDatum.liquidity_locked / jarDatum.tokens);
      this.pickleJarUSDPrices.set(getAddress(jarDatum.jarAddress), usdPrice);
    }
  }
}
