export interface Token {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
}

export interface Strategy {
  name: string;
  address: string;
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
  strategies: Strategy[];
  performanceFee?: number;
  withdrawalFee?: number;
}

export interface VaultV2 extends VaultBase {
  type: "v2";
  emergencyShutdown: boolean;
  apiVersion: string;
  strategies: Strategy[];
  tags: string[];
  performanceFee?: number;
  managementFee?: number;
}

export type Vault = VaultV1 | VaultV2;
