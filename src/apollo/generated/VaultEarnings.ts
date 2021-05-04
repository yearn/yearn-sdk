/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: VaultEarnings
// ====================================================

export interface VaultEarnings_vault_token {
  __typename: "Token";
  /**
   * Token address
   */
  id: string;
  /**
   * Number of decimals for this Token
   */
  decimals: number;
}

export interface VaultEarnings_vault_latestUpdate {
  __typename: "VaultUpdate";
  /**
   * Returns generated in Tokens
   */
  returnsGenerated: YearnSubgraphBigInt;
}

export interface VaultEarnings_vault {
  __typename: "Vault";
  /**
   * Token this Vault will accrue
   */
  token: VaultEarnings_vault_token;
  /**
   * Latest Vault Update
   */
  latestUpdate: VaultEarnings_vault_latestUpdate | null;
}

export interface VaultEarnings {
  vault: VaultEarnings_vault | null;
}

export interface VaultEarningsVariables {
  vault: string;
}
