const YVBOOST = "0x9d409a0a012cfba9b15f6d4b36ac57a46966ab9a";
const YVECRV = "0xc5bddf9843308380375a611c18b50fb9341f502a";
const PSLPYVBOOSTETH = "0xced67a187b923f0e5ebcc77c7f2f7da20099e378";

const LAB_ADDRESSESS = [YVBOOST, YVECRV, PSLPYVBOOSTETH];

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

export const buildAccountEarningsVariables = (id: string): { id: string; ignoredVaults: string[] } => ({
  id,
  ignoredVaults: LAB_ADDRESSESS
});

export const ACCOUNT_EARNINGS = `
  query AccountEarnings($id: ID!, $ignoredVaults: [String!]) {
    account(id: $id) {
      vaultPositions(where: { vault_not_in: $ignoredVaults } ) {
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

export const ASSET_HISTORIC_EARNINGS = (blocks: number[]): string => {
  const makeBlockQuery = (block: number): string => {
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
