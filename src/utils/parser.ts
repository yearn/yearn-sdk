import BigNumber from "bignumber.js";

import { Integer, Wei } from "../types";

export const toBN = (amount?: Integer | number): BigNumber => {
  return new BigNumber(amount || "0");
};

export const toWei = ({ amount, decimals }: { amount: Integer; decimals: number }): Wei => {
  const ONE_UNIT = toBN(10).pow(decimals);
  return toBN(amount)
    .times(ONE_UNIT)
    .toFixed(0);
};

export const toUnit = ({ amount, decimals }: { amount: Wei; decimals: number }): Integer => {
  const ONE_UNIT = toBN(10).pow(decimals);
  return toBN(amount)
    .div(ONE_UNIT)
    .toString();
};
