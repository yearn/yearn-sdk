import { CallOverrides, PopulatedTransaction } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/providers";

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
  static NO_SLIPPAGE = "no_slippage";

  constructor(message: string, error_code?: string) {
    super(message, "sdk");
    this.error_code = error_code;
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

/**
 * Interface to implement support for call overrides
 */
export interface Overridable {
  overrides?: CallOverrides;
}

/**
 * Props to use on transactions with write contract functionality
 */
export interface WriteTransactionProps extends Overridable {
  populate?: boolean;
}

/**
 * Interface to indicate if a write transaction will result in a populated transaction rather than execute
 */
export interface WillPopulate extends WriteTransactionProps {
  populate: true;
}

/**
 * Result to use on transactions with write contract functionality
 */
export type WriteTransactionResult<P> = Promise<P extends WillPopulate ? PopulatedTransaction : TransactionResponse>;

/**
 * Result to use on transactions with write contract functionality
 */
export interface TransactionOutcome {
  sourceTokenAddress: Address;
  sourceTokenAmount: Integer;
  sourceTokenAmountUsdc: Usdc;
  targetTokenAddress: Address;
  targetTokenAmount: Integer;
  targetTokenAmountUsdc: Usdc;
}
