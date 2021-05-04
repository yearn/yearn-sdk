/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProtocolEarnings
// ====================================================

export interface ProtocolEarnings_vaults_token {
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

export interface ProtocolEarnings_vaults_latestUpdate {
  __typename: "VaultUpdate";
  /**
   * Returns generated in Tokens
   */
  returnsGenerated: YearnSubgraphBigInt;
}

export interface ProtocolEarnings_vaults {
  __typename: "Vault";
  /**
   * Token this Vault will accrue
   */
  token: ProtocolEarnings_vaults_token;
  /**
   * Latest Vault Update
   */
  latestUpdate: ProtocolEarnings_vaults_latestUpdate | null;
}

export interface ProtocolEarnings {
  vaults: ProtocolEarnings_vaults[];
}
