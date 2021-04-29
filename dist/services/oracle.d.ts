import { Address, Integer, ContractService } from "../common";
import { ChainId } from "../chain";
import { Context } from "../context";
export declare const OracleAbi: string[];
/**
 * [[OracleService]] is the main pricing engine, used by all price calculations.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */
export declare class OracleService<T extends ChainId> extends ContractService {
    static abi: string[];
    constructor(chainId: T, ctx: Context);
    static addressByChain(chainId: ChainId): string;
    getCalculations(): Promise<Address[]>;
    getPriceUsdc(token: Address): Promise<Integer>;
    getUsdcAddress(): Promise<Integer>;
    isCurveLpToken(lpToken: Address): Promise<boolean>;
    getCurvePriceUsdc(lpToken: Address): Promise<Integer>;
    getBasePrice(lpToken: Address): Promise<Integer>;
    getVirtualPrice(lpToken: Address): Promise<Integer>;
    getFirstUnderlyingCoinFromPool(pool: Address): Promise<Address>;
    getCurveRegistryAddress(): Promise<Integer>;
    isIronBankMarket(token: Address): Promise<boolean>;
    getIronBankMarketPriceUsdc(token: Address): Promise<Integer>;
    getIronBankMarkets(): Promise<Address[]>;
    isLpToken(token: Address): Promise<boolean>;
    getPriceFromRouter(token0: Address, token1: Address): Promise<Integer>;
    getPriceFromRouterUsdc(token: Address): Promise<Integer>;
    getLpTokenTotalLiquidityUsdc(token: Address): Promise<Integer>;
    getLpTokenPriceUsdc(token: Address): Promise<Integer>;
}
