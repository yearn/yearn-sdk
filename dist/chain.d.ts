/**
 * Supported chains in the yearn ecosystem.
 */
export declare const Chains: {
    1: string;
    250: string;
    1337: string;
};
export declare type EthMain = 1;
export declare type FtmMain = 250;
export declare type EthLocal = 1337;
export declare type ChainId = keyof typeof Chains;
