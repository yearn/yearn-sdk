export const VAULT_EARNINGS = `query VaultEarnings($vault: ID!) {
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

export const PROTOCOL_EARNINGS = `query ProtocolEarnings {
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

export const ACCOUNT_EARNINGS = `query AccountEarnings($id: ID!) {
    account(id: $id) {
      vaultPositions {
        balanceShares
        token {
          id
          decimals
        }
        shareToken {
          symbol
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

export const ASSET_HISTORIC_EARNINGS = `query AssetHistoricEarnings($id: ID!, $fromDate: BigInt!, $toDate: BigInt!) {
    vault(id: $id) {
      id
      token {
        id
        decimals
      }
      vaultDayData(where: { timestamp_gte: $fromDate, timestamp_lte: $toDate }, first: 1000) {
        dayReturnsGenerated
        timestamp
      }
    }
  }
`;

export const ACCOUNT_HISTORIC_EARNINGS = `query AccountHistoricEarnings($id: ID!, $fromDate: String!, $sinceDate: BigInt!, $toDate: BigInt!) {
    account(id: $id) {
      vaultPositions(where: { shareToken: $shareToken }) {
        balanceShares
        token {
          id
          decimals
        }
        vault {
          vaultDayData(where: { timestamp_gte: $fromDate, timestamp_lte: $toDate }, orderBy: timestamp, orderDirection: asc, first: 1000) {
            pricePerShare
            timestamp
            tokenPriceUSDC
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

export const PROTOCOL_FEES = `query ProtocolFees($sinceDate: BigInt!) {
    transfers(where: { timestamp_gt: $sinceDate }, first: 1000) {
      tokenAmountUsdc
    }
  }
`;
