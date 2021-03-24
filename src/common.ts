import { Provider } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";

import { ChainId } from "./chain";

export type Address = string;

export type Value =
  | string
  | string[]
  | Address
  | Address[]
  | BigNumber
  | BigNumber[]
  | Struct
  | Struct[];

export type Struct = { [key: string]: Value };

export class Addressable {
  static abi: string[] = [];
  address: string;
  chainId: number;
  provider: Provider;

  contract: Contract;

  constructor(chainId: number, provider: Provider) {
    // @ts-ignore
    this.address = this.constructor.addressByChain(chainId);
    this.chainId = chainId;
    this.provider = provider;

    // @ts-ignore
    this.contract = new Contract(this.address, this.constructor.abi, provider);

    // TODO: Helpful errors + update events via proxy / reflection
    // Object.getOwnPropertyNames(Object.getPrototypeOf(this)));
  }

  static addressByChain(chainId: ChainId): string {
    throw new TypeError(
      `Addressable does not have an address for chainId ${chainId}`
    );
  }
}
