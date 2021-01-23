import { BigNumberish } from "ethers";
import { BigNumber } from "bignumber.js";

export { BigNumber } from "bignumber.js";
export { BigNumberish } from "ethers";

export function toBigNumber(n: BigNumberish): BigNumber {
  return new BigNumber(n.toString());
}
