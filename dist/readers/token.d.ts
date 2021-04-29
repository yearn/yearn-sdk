import { Address, Integer, Reader } from "../common";
import { ChainId } from "../chain";
import { Token, Balance, BalancesMap, IconMap, Icon } from "../types";
export declare class TokenReader<C extends ChainId> extends Reader<C> {
    priceUsdc(token: Address): Promise<Integer>;
    price(from: Address, to: Address): Promise<Integer>;
    balances<T extends Address>(address: T): Promise<Balance[]>;
    balances<T extends Address>(addresses: T[]): Promise<BalancesMap<T>>;
    supported(): Promise<Token[]>;
    icon<T extends Address>(address: T): Icon;
    icon<T extends Address>(addresses: T[]): IconMap<T>;
}
