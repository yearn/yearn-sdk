import { BigNumber } from "@ethersproject/bignumber";

import { Address, Integer, SdkError, Usdc } from "./types";

export const ZeroAddress = "0x0000000000000000000000000000000000000000";
export const EthAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const WethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// Returns truthy if address is defined as a native token address of a network
export function isNativeToken(address: Address): boolean {
  return address === EthAddress || address === ZeroAddress;
}

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
