import { BigNumber } from "@ethersproject/bignumber";

import { SdkError } from "./common";

export const ZeroAddress = "0x0000000000000000000000000000000000000000";
export const EthAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export async function handleHttpError(response: Response): Promise<Response> {
  if (response.status !== 200) {
    throw new SdkError(
      `HTTP to ${response.url} request failed (status ${response.status} ${response.statusText})`
    );
  }
  return response;
}

export function Usdc(value: any): BigNumber {
  return BigNumber.from(Math.floor(Number(value) * 1e6));
}
