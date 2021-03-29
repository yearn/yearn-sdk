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

export class Service {
  provider: Provider;
  chainId: ChainId;

  events: EventEmitter;

  constructor(chainId: ChainId, provider: Provider) {
    this.chainId = chainId;
    this.provider = provider;

    this.events = new EventEmitter();

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
            try {
              const res = target.apply(thisArg, argArray);
              if (res && res instanceof Promise) {
                res
                  .then(result => {
                    this.events.emit(method.name, result);
                    return result;
                  })
                  .catch(error => {
                    throw new SdkError(`${path}: ${error.message}`);
                  });
              } else {
                this.events.emit(method.name, res);
              }
              return res;
            } catch (error) {
              throw new SdkError(`${path}: ${error.message}`);
            }
          }
        })
      );
    }
  }
}

export class Reader<T extends ChainId> extends Service {
  protected yearn: Yearn<T>;

  constructor(yearn: Yearn<T>, chainId: T, provider: Provider) {
    super(chainId, provider);
    this.yearn = yearn;
  }
}

export class ContractProvider extends Service {
  static abi: string[] = [];

  address: string;

  contract: Contract;

  constructor(address: Address, chainId: ChainId, provider: Provider) {
    super(chainId, provider);
    this.address = address;

    // @ts-ignore
    this.contract = new Contract(this.address, this.constructor.abi, provider);
  }
}
