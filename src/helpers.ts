import { BigNumber } from "@ethersproject/bignumber";

import { Address, Integer, SdkError, Token, Usdc } from "./types";

export const ZeroAddress = "0x0000000000000000000000000000000000000000";
export const EthAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const WethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const WrappedFantomAddress = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";

export const ZAPPER_OUT_ADDRESSES = {
  ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
};

export const FANTOM_TOKEN: Token = {
  address: ZeroAddress,
  name: "Fantom",
  dataSource: "fantom",
  decimals: "18",
  priceUsdc: "0",
  supported: {
    ftmApeZap: true
  },
  symbol: "FTM"
};

// handle a non-200 `fetch` response.
export async function handleHttpError(response: Response): Promise<Response> {
  if (response.status !== 200) {
    const { url, status, statusText } = response;
    throw new SdkError(`HTTP to ${url} request failed (status ${status} ${statusText})`);
  }
  return response;
}

// formally convert USD values to USDC values (* 1e6), using Usdc type alias.
export function usdc(usd: unknown): Usdc {
  return BigNumber.from(Math.floor(Number(usd) * 1e6)).toString();
}

// formally convert BigNumber to Integer type alias.
export function int(value: BigNumber): Integer {
  return value.toString();
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  if (size < 1) {
    throw new Error(`Size needs to be positive: ${size}`);
  }

  const result = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk = array.slice(i, i + size);
    result.push(chunk);
  }
  return result;
}

// converts timestamps from second and microsecond format to milliseconds
export function convertSecondsMillisOrMicrosToMillis(timestamp: string | number): number {
  const testSeconds = /^\d{10}$/;
  const testMillis = /^\d{13}$/;
  const testMicros = /^\d{16}$/;

  let input = typeof timestamp === "string" ? timestamp : timestamp.toString();
  input = input.padStart(10, "0"); // optional padding in case of a number input
  if (testMillis.test(input)) {
    return +timestamp;
  } else if (testMicros.test(input)) {
    return +timestamp / 1000;
  } else if (testSeconds.test(input)) {
    return +timestamp * 1000;
  } else {
    throw new Error("Timestamp in invalid format");
  }
}

/**
 * Merges array b into a by address removing a duplicates from b
 *
 * @param a higher priority array
 * @param b lower priority array
 *
 * @returns combined arrays by address without duplicates
 */
export function mergeByAddress<T extends { address: Address }>(a: T[], b: T[]): T[] {
  const filter = new Set(a.map(({ address }) => address));

  return [...a, ...b.filter(({ address }) => !filter.has(address))];
}
