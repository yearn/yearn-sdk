/**
 * Generic SDK error. Wrapped errors are:
 *
 * - ethers.js errors
 * - http request errors
 */
export class SdkError extends Error {}

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
 * Utility type to help distinguish [[Integers]] that represent a USDC (6 dec)
 * value.
 */
export type Usdc = string;

/**
 * Utility type to describe a map of predefined keys with the same value.
 */
export type TypedMap<K extends string | number | symbol, V> = { [key in K]: V };
