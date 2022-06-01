export class CustomError extends Error {
  errorType: string;

  constructor(message: string, errorType: string) {
    super(message);
    this.errorType = errorType;
  }
}

/**
 * Generic SDK error. Wrapped errors are:
 *
 * - ethers.js errors
 * - http request errors
 */
export class SdkError extends CustomError {
  errorCode?: string;
  static NO_SLIPPAGE = "no_slippage";

  constructor(message: string, errorCode?: string) {
    super(message, "sdk");
    this.errorCode = errorCode;
  }
}

/**
 * Type alias for an address type.
 */
export type Address = string;

/**
 * Type for anything that has an address property.
 */
export type Addressable = { address: Address };

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
 * Utility type to help distinguish [[Integer]]s that represents an already
 * normalized value with the corresponding decimals from their Integer form.
 */
export type Unit = string;

/**
 * Utility type to describe a map of predefined keys with the same value.
 */
export type TypedMap<K extends string | number | symbol, V> = { [key in K]: V };

/**
 * Accepted locales.
 */
export type Locale = "de" | "el" | "en" | "es" | "fr" | "hi" | "id" | "ja" | "pt" | "ru" | "tr" | "vi" | "zh";
