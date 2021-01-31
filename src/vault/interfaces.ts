export interface Token {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
}

export interface Strategy {
  name: string;
  address: string;
  isActive: boolean;
  delegatedAssets: number;
}

export interface VaultBase {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  token: Token;
}

export interface VaultV1 extends VaultBase {
  type: "v1";
}

export interface VaultV2 extends VaultBase {
  type: "v2";
  emergencyShutdown: boolean;
  strategies: Strategy[];
}

export type Vault = VaultV1 | VaultV2;
