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

export const ACCOUNT_EARNINGS = gql`
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
          id
          latestUpdate {
            pricePerShare
          }
        }
      }
    }
  }
`;

export const ASSET_HISTORIC_EARNINGS = gql`
  query AssetHistoricEarnings($id: ID!, $sinceDate: String!) {
    vault(id: $id) {
      id
      token {
        id
        decimals
      }
      vaultDayData(where: { date_gt: $sinceDate }, first: 1000) {
        dayReturnsGenerated
        date
      }
    }
  }
`;

export const ACCOUNT_HISTORIC_EARNINGS = gql`
  query AccountHistoricEarnings($id: ID!, $shareToken: String!, $sinceDate: String!) {
    account(id: $id) {
      vaultPositions(where: { shareToken: $shareToken }) {
        balanceShares
        token {
          id
          decimals
        }
        vault {
          vaultDayData(where: { date_gt: $sinceDate }, orderBy: date, orderDirection: asc, first: 1000) {
            pricePerShare
            date
          }
        }
        updates(orderBy: timestamp, orderDirection: asc, first: 1000) {
          balanceShares
          timestamp
          deposits
          withdrawals
          tokensReceived
          tokensSent
        }
      }
    }
  }
`;

export const PROTOCOL_FEES = gql`
  query ProtocolFees($sinceDate: String!) {
    transfers(where: { timestamp_gt: $sinceDate, isProtocolFee: true }, first: 1000) {
      tokenAmountUsdc
    }
  }
`;
