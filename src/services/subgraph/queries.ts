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

export const ASSET_HISTORIC_EARNINGS = (blocks: number[]) => {
  const makeBlockQuery = (block: number) => {
    return `
    block_${block}: vault(id: $id, block: { number: ${block} } ) {
      vaultDayData(orderBy: timestamp, orderDirection: desc, first: 1) {
        timestamp
      }
      strategies {
        latestReport {
          totalGain
          totalLoss
        }
      }
    }
    `;
  };

  const historicQueries = blocks.map(block => makeBlockQuery(block));

  const result = `query AssetHistoricEarnings($id: ID!) {
    vault(id: $id) {
      token {
        id
        decimals
      }
    }
    ${historicQueries.join("")}
  }
  `;

  return result;
};

export const ACCOUNT_HISTORIC_EARNINGS = `query AccountHistoricEarnings($id: ID!, $shareToken: String!, $fromDate: String!, $toDate: BigInt!) {
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
