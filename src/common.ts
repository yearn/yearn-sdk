import EventEmitter from "events";
import { Contract, ContractInterface } from "@ethersproject/contracts";

import { ChainId } from "./chain";
import { Yearn } from "./yearn";
import { Context, ReadWriteProvider } from "./context";
import { Address } from "./types";

export class Service {
  ctx: Context;
  chainId: ChainId;

  events: EventEmitter;

  constructor(chainId: ChainId, ctx: Context) {
    this.chainId = chainId;
    this.ctx = ctx;

    this.events = new EventEmitter();
  }
}

export class Reader<T extends ChainId> extends Service {
  protected yearn: Yearn<T>;

  constructor(yearn: Yearn<T>, chainId: T, ctx: Context) {
    super(chainId, ctx);
    this.yearn = yearn;

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
            const cached = this.ctx.cache.get(path, ...argArray);
            if (cached) {
              console.debug(`[SDK] Cache hit ${path}`);
              return cached;
            } else {
              console.debug(`[SDK] Cache miss ${path}`);
            }
            const res = target.apply(thisArg, argArray);
            if (res && res instanceof Promise) {
              res.then(result => {
                this.ctx.cache.set(result, path, ...argArray);
                return result;
              });
            } else {
              this.ctx.cache.set(res, path, ...argArray);
            }
            return res;
          }
        })
      );
    }
  }
}

export class WrappedContract {
  address: Address;
  abi: ContractInterface;

  read: Contract;
  write: Contract;

  constructor(address: Address, abi: ContractInterface, ctx: Context) {
    this.address = address;
    this.abi = abi;

    this.read = new Contract(address, abi, ctx.provider.read);
    this.write = new Contract(address, abi, ctx.provider.write);
    ctx.events.on(Context.PROVIDER, (provider: ReadWriteProvider) => {
      console.log(this.address, this.abi, provider.read);
      this.read = new Contract(this.address, this.abi, provider.read);
      this.write = new Contract(this.address, this.abi, provider.write);
    });
  }
}

export class ContractService extends Service {
  static abi: string[] = [];

  address: string;

  contract: WrappedContract;

  constructor(address: Address, chainId: ChainId, ctx: Context) {
    super(chainId, ctx);
    this.address = address;

    this.contract = new WrappedContract(
      this.address,
      // @ts-ignore
      this.constructor.abi,
      ctx
    );
  }
}
