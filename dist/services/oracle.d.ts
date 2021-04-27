import { BigNumber } from "@ethersproject/bignumber";
import { Address, ContractService } from "../common";
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
    getPriceUsdc(token: Address): Promise<BigNumber>;
    getUsdcAddress(): Promise<BigNumber>;
    isCurveLpToken(lpToken: Address): Promise<boolean>;
    getCurvePriceUsdc(lpToken: Address): Promise<BigNumber>;
    getBasePrice(lpToken: Address): Promise<BigNumber>;
    getVirtualPrice(lpToken: Address): Promise<BigNumber>;
    getFirstUnderlyingCoinFromPool(pool: Address): Promise<Address>;
    getCurveRegistryAddress(): Promise<BigNumber>;
    isIronBankMarket(token: Address): Promise<boolean>;
    getIronBankMarketPriceUsdc(token: Address): Promise<BigNumber>;
    getIronBankMarkets(): Promise<Address[]>;
    isLpToken(token: Address): Promise<boolean>;
    getPriceFromRouter(token0: Address, token1: Address): Promise<BigNumber>;
    getPriceFromRouterUsdc(token: Address): Promise<BigNumber>;
    getLpTokenTotalLiquidityUsdc(token: Address): Promise<BigNumber>;
    getLpTokenPriceUsdc(token: Address): Promise<BigNumber>;
}
