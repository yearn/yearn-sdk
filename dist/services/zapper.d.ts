import { Address, Service } from "../common";
import { Balance, BalancesMap, GasPrice, Token } from "../types";
/**
 * [[ZapperService]] interacts with the zapper api to gather more insight for
 * tokens and user positions.
 */
export declare class ZapperService extends Service {
    supportedTokens(): Promise<Token[]>;
    balances<T extends Address>(address: T): Promise<Balance[]>;
    balances<T extends Address>(addresses: T[]): Promise<BalancesMap<T>>;
    balances<T extends Address>(addresses: T[] | T): Promise<BalancesMap<T> | Balance[]>;
    gas(): Promise<GasPrice[]>;
}
