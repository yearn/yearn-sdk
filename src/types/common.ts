/**
 * Generic SDK error, likely caused by internal method calls.
 *
 * // TODO: setup error codes
 */
export class SdkError extends Error {}

export type Address = string;
export type Integer = string;

export type Usdc = string;

export type TypedMap<K extends string | number | symbol, V> = { [key in K]: V };
