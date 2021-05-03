import { ChainId } from "../chain";
import { Address, Reader, Usdc } from "../common";
import { TokenAmount } from "../types";
export interface AssetEarnings extends Earnings {
    assetId: Address;
}
export interface Earnings extends TokenAmount {
    tokenId: Address;
}
export declare class EarningsReader<C extends ChainId> extends Reader<C> {
    protocolEarnings(): Promise<Usdc>;
    assetEarnings(vaultAddress: Address): Promise<AssetEarnings>;
    private tokensValueInUsdc;
}
