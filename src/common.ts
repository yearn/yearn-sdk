import EventEmitter from "events";
import { Provider } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";

import { ChainId } from "./chain";
import { SdkError } from "./error";
import { Yearn } from "./yearn";

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

export class Service extends EventEmitter {
  provider: Provider;
  chainId: number;

  constructor(chainId: number, provider: Provider) {
    super();
    this.chainId = chainId;
    this.provider = provider;

    // Error handling + update events via proxy / reflection
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

    for (const property of methods) {
      const method = Reflect.get(this, property);
      const path = [this.constructor.name, method.name].join(".");
      Reflect.set(
        this,
        property,
        new Proxy(method, {
          apply: (target, thisArg, argArray) => {
            const res = target.apply(thisArg, argArray);
            if (res && res instanceof Promise) {
              res
                .then(result => {
                  this.emit(method.name, result);
                  return result;
                })
                .catch(error => {
                  throw new SdkError(`${path}: ${error.message}`);
                });
            }
            return res;
          }
        })
      );
    }
  }
}

export class Interface extends Service {
  yearn: Yearn;

  constructor(yearn: Yearn, chainId: number, provider: Provider) {
    super(chainId, provider);
    this.yearn = yearn;
  }
}

export class Addressable extends Service {
  static abi: string[] = [];
  address: string;

  contract: Contract;

  constructor(chainId: number, provider: Provider) {
    super(chainId, provider);

    // @ts-ignore
    this.address = this.constructor.addressByChain(chainId);

    // @ts-ignore
    this.contract = new Contract(this.address, this.constructor.abi, provider);
  }

  static addressByChain(chainId: ChainId): string {
    throw new TypeError(
      `Addressable does not have an address for chainId ${chainId}`
    );
  }
}
