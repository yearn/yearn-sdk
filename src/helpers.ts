import { BigNumber } from "@ethersproject/bignumber";

import { SdkError, Integer, Usdc } from "./common";

export const ZeroAddress = "0x0000000000000000000000000000000000000000";
export const EthAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export async function handleHttpError(response: Response): Promise<Response> {
  if (response.status !== 200) {
    const { url, status, statusText } = response;
    throw new SdkError(`HTTP to ${url} request failed (status ${status} ${statusText})`);
  }
  return response;
}

export function usdc(value: any): Usdc {
  return BigNumber.from(Math.floor(Number(value) * 1e6)).toString();
}

export function int(value: BigNumber): Integer {
  return value.toString();
}
