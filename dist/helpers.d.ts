import { BigNumber } from "@ethersproject/bignumber";
import { Integer, Usdc } from "./common";
export declare const ZeroAddress = "0x0000000000000000000000000000000000000000";
export declare const EthAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export declare function handleHttpError(response: Response): Promise<Response>;
export declare function usdc(value: any): Usdc;
export declare function int(value: BigNumber): Integer;
