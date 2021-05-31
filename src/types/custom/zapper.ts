/**
 * Simple gas prices in gwei
 */
export interface GasPrice {
  standard: number;
  instant: number;
  fast: number;
}

export interface ZapOptions {
  slippage?: number;
  gas?: keyof GasPrice;
}
