import { getAddress } from "@ethersproject/address";
import { BigNumber } from "bignumber.js";

import { Address } from "./types/common";

const hour = 1000 * 60 * 60;
const pickleApiUrl = "https://stkpowy01i.execute-api.us-west-1.amazonaws.com/prod/protocol/pools";

export class PickleJarPriceProvider {
  private pickleJarUSDPrices: Map<Address, BigNumber> = new Map();
  private lastFetchedDate: Date = new Date(0);
  private pickleJars: Address[];

  constructor(pickleJars: Address[]) {
    this.pickleJars = pickleJars;
  }

  /**
   * Fetches the USD price of a pickle jar token
   * @param jar the address of the jar to fetch
   * @returns the price of the jar token in USD
   */
  async getPriceUSD(jar: Address): Promise<BigNumber> {
    const oneHourAgo = new Date(Date.now() - hour);
    if (this.lastFetchedDate < oneHourAgo) {
      await this.fetchPickleJarPrices();
    }
    return this.pickleJarUSDPrices.get(jar) || new BigNumber(0);
  }

  private async fetchPickleJarPrices() {
    interface JarDatum {
      liquidity_locked: number;
      jarAddress: Address;
      tokens: number;
    }

    const jarData: JarDatum[] = await fetch(pickleApiUrl).then(res => res.json());

    this.pickleJarUSDPrices.clear();
    this.lastFetchedDate = new Date();

    const relevantJars = jarData.filter(jar => this.pickleJars.includes(getAddress(jar.jarAddress)));

    for (const jarDatum of relevantJars) {
      const usdPrice = new BigNumber(jarDatum.liquidity_locked / jarDatum.tokens);
      this.pickleJarUSDPrices.set(getAddress(jarDatum.jarAddress), usdPrice);
    }
  }
}
