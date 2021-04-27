import { BigNumber } from "@ethersproject/bignumber";
import { Address } from "../common";
import { Metadata, TypeId } from "./metadata";
export interface Position {
    assetId: Address;
    tokenId: Address;
    typeId: string;
    balance: BigNumber;
    underlyingTokenBalance: TokenAmount;
    assetAllowances: Allowance[];
    tokenAllowances: Allowance[];
}
export interface Allowance {
    owner: Address;
    spender: Address;
    amount: BigNumber;
}
export interface ERC20 {
    id: Address;
    name: string;
    symbol: string;
    decimals: BigNumber;
}
export interface TokenAmount {
    amount: BigNumber;
    amountUsdc: BigNumber;
}
export interface Token extends ERC20 {
    price: BigNumber;
    supported: {
        zapper?: boolean;
    };
}
export declare type Icon = string | undefined;
export declare type IconMap<T extends Address> = {
    [K in T]: Icon;
};
export interface AssetStatic<T extends TypeId> {
    id: Address;
    typeId: T;
    name: string;
    version: string;
    token: ERC20;
}
export interface AssetDynamic<T extends TypeId> {
    id: Address;
    typeId: T;
    tokenId: Address;
    underlyingTokenBalance: TokenAmount;
    metadata: Metadata[T];
}
export declare type Asset<T extends TypeId> = AssetStatic<T> & AssetDynamic<T> & {
    typeId: T;
};
export declare type GenericAsset = Asset<"VAULT_V1"> | Asset<"VAULT_V2">;
