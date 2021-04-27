/// <reference types="node" />
import EventEmitter from "events";
import { Contract } from "@ethersproject/contracts";
import { ChainId } from "./chain";
import { Yearn } from "./yearn";
import { Context } from "./context";
/**
 * Generic SDK error, likely caused by internal method calls.
 *
 * // TODO: setup error codes
 */
export declare class SdkError extends Error {
}
export declare type Address = string;
export declare class Service {
    ctx: Context;
    chainId: ChainId;
    events: EventEmitter;
    constructor(chainId: ChainId, ctx: Context);
}
export declare class Reader<T extends ChainId> extends Service {
    protected yearn: Yearn<T>;
    constructor(yearn: Yearn<T>, chainId: T, ctx: Context);
}
export declare class ContractService extends Service {
    static abi: string[];
    address: string;
    contract: Contract;
    constructor(address: Address, chainId: ChainId, ctx: Context);
}
