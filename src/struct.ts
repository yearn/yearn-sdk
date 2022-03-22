/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Utility functions to convert raw structures returned from ethers to plain
 * javascript objects.
 *
 * eg.
 *
 * ```javascript
 * [
 *   1,
 *   "hello"
 *   "a": 1,
 *   "b": "hello"
 * ]
 * ```
 *
 * to
 *
 * ```javascript
 * {
 *   "a": 1,
 *   "b": "hello"
 * }
 * ```
 */

import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber";

// convert tuples
export function struct(tuple: any): any {
  if (typeof tuple !== "object") return tuple;
  const keys = Object.keys(tuple);

  // check if tuple is actually an array
  // [1, 2, 3] => array vs [1, 2, 3, "a": 1, "b": 2, "c": 3] => object
  // NOTE: [] are not picked up as array (see *)
  const properties = keys.filter(key => isNaN(Number(key)));
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (properties.length === 0) return structArray(tuple);

  const copy: Record<string, unknown> = {};

  properties.forEach((property: string) => {
    const value = tuple[property];
    if (typeof value === "object" && !isBigNumberish(value)) {
      // recursive!
      copy[property] = struct(value);
    } else if (Array.isArray(value)) {
      // (*) all empty arrays are picked up here
      copy[property] = value;
    } else if (isBigNumberish(value)) {
      // all BigNumbers are converted to strings
      copy[property] = value.toString();
    } else {
      copy[property] = value;
    }
  });

  return copy;
}

// convert arrays
export function structArray(tuples: any[]): any[] {
  return tuples.map(tuple => struct(tuple));
}
