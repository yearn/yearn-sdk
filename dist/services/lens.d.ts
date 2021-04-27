import { GenericAsset, Position } from "../types";
import { Address, ContractService } from "../common";
import { ChainId, EthMain, EthLocal } from "../chain";
import { Context } from "../context";
import { IRegistryAdapter, RegistryV2Adapter } from "./adapters/registry";
export declare const LensAbi: string[];
export declare type Adapters<T extends ChainId> = T extends EthMain | EthLocal ? {
    vaults: {
        v1: IRegistryAdapter;
        v2: RegistryV2Adapter<T>;
    };
} : {
    vaults: {
        v2: RegistryV2Adapter<T>;
    };
};
/**
 * [[LensService]] provides access to all yearn's assets and user positions.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */
export declare class LensService<T extends ChainId> extends ContractService {
    static abi: string[];
    constructor(chainId: T, ctx: Context);
    get adapters(): Adapters<T>;
    static addressByChain(chainId: ChainId): string;
    getRegistries(): Promise<string[]>;
    getAssets(): Promise<GenericAsset[]>;
    getAssetsFromAdapter(adapter: Address): Promise<GenericAsset[]>;
    getPositions(address: string): Promise<Position[]>;
}
