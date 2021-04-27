import { BigNumber } from "@ethersproject/bignumber";
import { Address, Reader } from "../common";
import { ChainId } from "../chain";
import { Token, Balance, BalancesMap, IconMap, Icon } from "../types";
export declare class TokenReader<C extends ChainId> extends Reader<C> {
    priceUsdc(token: Address): Promise<BigNumber>;
    price(from: Address, to: Address): Promise<BigNumber>;
    balances<T extends Address>(address: T): Promise<Balance[]>;
    balances<T extends Address>(addresses: T[]): Promise<BalancesMap<T>>;
    supported(): Promise<Token[]>;
    icon<T extends Address>(address: T): Icon;
    icon<T extends Address>(addresses: T[]): IconMap<T>;
}
