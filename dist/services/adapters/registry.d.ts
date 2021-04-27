import { ChainId } from "../../chain";
import { Address, ContractService } from "../../common";
import { Context } from "../../context";
import { Position, VaultStatic, VaultDynamic, VaultV2Static, VaultV2Dynamic, ERC20 } from "../../types";
export interface IRegistryAdapter {
    assetsStatic(): Promise<VaultStatic[]>;
    assetsDynamic(): Promise<VaultDynamic[]>;
    positionsOf(address: Address, addresses?: Address[]): Promise<Position[]>;
    tokens(): Promise<ERC20[]>;
}
export declare const RegistryV2AdapterAbi: string[];
export declare class RegistryV2Adapter<T extends ChainId> extends ContractService implements IRegistryAdapter {
    static abi: string[];
    constructor(chainId: T, ctx: Context);
    static addressByChain(chainId: ChainId): string;
    assetsStatic(addresses?: Address[]): Promise<VaultV2Static[]>;
    assetsDynamic(addresses?: Address[]): Promise<VaultV2Dynamic[]>;
    positionsOf(address: Address, addresses?: Address[]): Promise<Position[]>;
    tokens(): Promise<ERC20[]>;
}
