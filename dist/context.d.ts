import { Provider } from "@ethersproject/providers";
import { CacheManager, Cache } from "./cache";
import { Address } from "./common";
export interface AddressesOverride {
    lens?: Address;
    oracle?: Address;
    registryV2Adapter?: Address;
}
export interface ContextValue {
    provider?: Provider;
    zapper?: string;
    etherscan?: string;
    addresses?: AddressesOverride;
}
export declare class Context implements Required<ContextValue> {
    private ctx;
    cache: CacheManager;
    constructor(ctx: ContextValue, cache?: Cache);
    get provider(): Provider;
    get zapper(): string;
    get etherscan(): string;
    get addresses(): AddressesOverride;
    address(service: keyof AddressesOverride): Address | undefined;
}
