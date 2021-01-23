export interface Token {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
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
}

export type Vault = VaultV1 | VaultV2;
