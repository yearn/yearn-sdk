import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber";

export function struct(tuple: any): any {
  if (typeof tuple !== "object") return tuple;
  const keys = Object.keys(tuple);
  const properties = keys.filter(key => isNaN(Number(key)));
  if (properties.length === 0) return structArray(tuple);
  const copy: Record<string, unknown> = {};

  properties.forEach((property: string) => {
    const value = tuple[property];
    if (typeof value === "object" && !isBigNumberish(value)) {
      copy[property] = struct(value);
    } else if (isBigNumberish(value)) {
      copy[property] = value.toString();
    } else {
      copy[property] = value;
    }
  });

  return copy;
}

export function structArray(tuples: any[]): any[] {
  return tuples.map(tuple => struct(tuple));
}
