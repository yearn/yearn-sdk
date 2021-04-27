import { ChainId } from "../chain";
import { Address, Service } from "../common";
import { Context } from "../context";
import { Icon, IconMap } from "../types";
/**
 * [[IconsService]] fetches correct icons related to eth addresses
 * from trusted asset sources
 */
export declare class IconsService extends Service {
    ready: Promise<void>;
    supported: Map<Address, string>;
    constructor(chainId: ChainId, ctx: Context);
    private initialize;
    get<T extends Address>(address: T): Icon;
    get<T extends Address>(addresses: T[]): IconMap<T>;
    get<T extends Address>(address: T | T[]): IconMap<T> | Icon;
}
