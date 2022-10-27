import { Contract, ContractInterface } from "@ethersproject/contracts";
import Emittery from "emittery";

import { ChainId } from "./chain";
import { Context, ReadWriteProvider } from "./context";
import { AddressProvider } from "./services/addressProvider";
import { Address } from "./types";
import { Yearn } from "./yearn";

export class Service<E = Record<string, unknown>> {
  ctx: Context;
  chainId: ChainId;

  events: Emittery<E>;

  constructor(chainId: ChainId, ctx: Context) {
    this.chainId = chainId;
    this.ctx = ctx;

    this.events = new Emittery();
  }
}

export class ServiceInterface<T extends ChainId, E = Record<string, unknown>> extends Service<E> {
  protected yearn: Yearn<T>;

  constructor(yearn: Yearn<T>, chainId: T, ctx: Context) {
    super(chainId, ctx);
    this.yearn = yearn;
  }
}

/**
 * Contract that supports two different providers to differentiate read and
 * write operations.
 */
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
      this.read = new Contract(this.address, this.abi, provider.read);
      this.write = new Contract(this.address, this.abi, provider.write);
    });
  }
}

export enum ContractAddressId {
  oracle = "ORACLE",
  adapter_registry_v2 = "REGISTRY_ADAPTER_V2_VAULTS",
  helper = "HELPER",
  allowlist = "ALLOW_LIST_REGISTRY",
  partner = "PARTNER_TRACKER",
  zapperZapIn = "ZAPPER_ZAP_IN",
  zapperZapOut = "ZAPPER_ZAP_OUT",
  portalsZapIn = "PORTALS_ZAP_IN",
  portalsZapOut = "PORTALS_ZAP_OUT",
  pickleZapIn = "PICKLE_ZAP_IN",
  widoZapRouter = "WIDO_ZAP_ROUTER",
  propertiesAggregator = "PROPERTIES_AGGREGATOR",
  gaugeRegistry = "GAUGE_REGISTRY",
  claimRewardsZap = "CLAIM_REWARDS_ZAP",
  unused = "UNUSED",
}

/**
 * A service that has a contract representation on chain.
 */
export class ContractService<T extends ChainId, E = Record<string, unknown>> extends Service<E> {
  static abi: string[] = [];
  static contractId: ContractAddressId = ContractAddressId.unused;

  addressProvider: AddressProvider<T>;

  constructor(chainId: T, ctx: Context, addressProvider: AddressProvider<T>) {
    super(chainId, ctx);
    this.addressProvider = addressProvider;
  }

  protected async _getContract(abi: string[], contractId: ContractAddressId, ctx: Context): Promise<WrappedContract> {
    if (contractId === ContractAddressId.unused) {
      throw new Error(`Trying to get the contract instance on the generic class.`);
    }

    try {
      const address = await this.addressProvider.addressById(contractId);
      // TODO - check whether `address` is zero, if it is then throw an error.
      // Needs to be handled appropriately wherever this function is used
      return new WrappedContract(address, abi, ctx);
    } catch (e) {
      console.error(`Contract address for ${contractId} is missing from the Address Provider`);
      throw e;
    }
  }
}
