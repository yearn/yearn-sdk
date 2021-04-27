import { Position, Vault, Apy } from "../types";
import { ChainId } from "../chain";
import { Address, Reader } from "../common";
export declare class VaultReader<T extends ChainId> extends Reader<T> {
    get(addresses?: Address[]): Promise<Vault[]>;
    assetsPositionsOf(address: Address, addresses?: Address[]): Promise<Position[]>;
    apy(address: Address): Promise<Apy | undefined>;
}
