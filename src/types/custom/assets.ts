import { Address, TypedMap } from "../common";

/**
 * An URL pointing to an image/png file.
 */
export type Icon = string | undefined;

export type IconMap<T extends Address> = TypedMap<T, Icon>;

export interface Alias {
  name: string;
  symbol: string;
  address: Address;
}

export type AliasMap<T extends Address> = TypedMap<T, Alias>;
