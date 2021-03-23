import { BigNumber } from "@ethersproject/bignumber";

export type Address = string;

export type Value =
  | string
  | string[]
  | Address
  | Address[]
  | BigNumber
  | BigNumber[]
  | Struct
  | Struct[];

export type Struct = { [key: string]: Value };
