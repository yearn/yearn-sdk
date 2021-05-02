import { ChainId } from "../chain";
import { Address, Reader, Usdc } from "../common";
import { TokenAmount } from "../types";
export interface AccountEarnings {
    earnings: AssetEarnings[];
    accountId: Address;
    totalEarnedUsdc: Usdc;
}
export interface AssetEarnings extends Earnings {
    assetId: Address;
}
export interface Earnings extends TokenAmount {
    tokenId: Address;
}
export declare class EarningsReader<C extends ChainId> extends Reader<C> {
    protocolEarnings(): Promise<Usdc>;
    assetEarnings(vaultAddress: Address): Promise<AssetEarnings>;
    accountEarnings(accountAddress: Address): Promise<AccountEarnings>;
    private tokensValueInUsdc;
}
