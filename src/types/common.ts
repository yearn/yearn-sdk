export class CustomError extends Error {
  error_type: string;

  constructor(message: string, error_type: string) {
    super(message);
    this.error_type = error_type;
  }
}

/**
 * Generic SDK error. Wrapped errors are:
 *
 * - ethers.js errors
 * - http request errors
 */
export class SdkError extends CustomError {
  error_code?: string;
  static NO_SLIPPAGE = 'no_slippage';

  constructor(message: string, error_code?: string) {
    super(message, 'sdk');
    this.error_code = error_code;
  }
}

/**
 * Type alias for an address type.
 */
export type Address = string;

/**
 * Type alias for a stringified big number. SDK tries to be bignumber-lib
 * agnostic so integer values are returned as strings.
 */
export type Integer = string;

/**
 * Utility type to help distinguish [[Integer]]s that represent a USDC (6 dec)
 * value.
 */
export type Usdc = string;

/**
 * Utility type to describe a map of predefined keys with the same value.
 */
export type TypedMap<K extends string | number | symbol, V> = { [key in K]: V };
