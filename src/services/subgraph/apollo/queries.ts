import gql from "graphql-tag";

declare global {
  type YearnSubgraphBigInt = string;
}

export const VAULT_EARNINGS = gql`
  query VaultEarnings($vault: ID!) {
    vault(id: $vault) {
      token {
        id
        decimals
      }
      latestUpdate {
        returnsGenerated
      }
    }
  }
`;

export const PROTOCOL_EARNINGS = gql`
  query ProtocolEarnings {
    vaults {
      token {
        id
        decimals
      }
      latestUpdate {
        returnsGenerated
      }
    }
  }
`;

export const ACCOUNT_EARNINGS= gql`
  query AccountEarnings($id: ID!) {
    account(id: $id) {
      vaultPositions {
        balanceShares
        token {
          id
          decimals
        }
        updates {
          deposits
          withdrawals
          tokensReceived
          tokensSent
        }
        vault {
          latestUpdate {
            pricePerShare
          }
        }
      }
    }
  }
`
