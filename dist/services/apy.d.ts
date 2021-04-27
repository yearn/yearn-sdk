import { Address, Service } from "../common";
import { Apy } from "../types";
/**
 * [[ApyService]] provides access to off chain apy calculations for yearn
 * products.
 */
export declare class ApyService extends Service {
    get(address: Address): Promise<Apy | undefined>;
}
