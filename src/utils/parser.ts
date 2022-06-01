import BigNumber from "bignumber.js";

import { Integer, Unit } from "../types";

BigNumber.set({ EXPONENTIAL_AT: 50 });

export const USDC_DECIMALS = 6;

export const toBN = (amount?: Integer | number): BigNumber => {
  return new BigNumber(amount || "0");
};

export const toWei = ({ amount, decimals }: { amount: Unit; decimals: number }): Integer => {
  const ONE_UNIT = toBN(10).pow(decimals);
  return toBN(amount).times(ONE_UNIT).toFixed(0);
};

export const toUnit = ({ amount, decimals }: { amount: Integer; decimals: number }): Unit => {
  const ONE_UNIT = toBN(10).pow(decimals);
  return toBN(amount).div(ONE_UNIT).toString();
};
