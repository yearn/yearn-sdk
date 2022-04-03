import { Integer } from "../../types/common";

export interface ProtocolEarningsResponse {
  data: {
    vaults: {
      latestUpdate?: {
        returnsGenerated: Integer;
      };
      token: {
        decimals: number;
        id: string;
      };
    }[];
  };
}

export interface VaultEarningsResponse {
  data: {
    vault?: {
      token: {
        id: string;
        decimals: number;
      };
      latestUpdate?: {
        returnsGenerated: Integer;
      };
    };
  };
}

export type BlockLabel = `block_${number}`;

export interface AssetHistoricEarningsResponse {
  data: {
    [label: BlockLabel]: {
      strategies: {
        latestReport: {
          totalGain: string;
          totalLoss: string;
        };
      }[];
      vaultDayData: [{ timestamp: number }];
    };
    vault: {
      token: {
        id: string;
        decimals: number;
      };
    };
  };
}

export interface AccountEarningsResponse {
  data: {
    account?: {
      vaultPositions: {
        balanceShares: Integer;
        token: {
          id: string;
          decimals: number;
        };
        shareToken: {
          symbol: string;
        };
        updates: {
          deposits: Integer;
          withdrawals: Integer;
          tokensReceived: Integer;
          tokensSent: Integer;
        }[];
        vault: {
          id: string;
          latestUpdate?: {
            pricePerShare: Integer;
          };
        };
      }[];
    };
  };
}

export interface AccountHistoricEarningsResponse {
  data: {
    account?: {
      vaultPositions: {
        balanceShares: Integer;
        token: {
          id: string;
          decimals: number;
        };
        vault: {
          vaultDayData: {
            pricePerShare: Integer;
            timestamp: Integer;
            tokenPriceUSDC: Integer;
          }[];
        };
        updates: {
          balanceShares: Integer;
          timestamp: Integer;
          deposits: Integer;
          withdrawals: Integer;
          tokensReceived: Integer;
          tokensSent: Integer;
        }[];
      }[];
    };
  };
}

export interface FeesResponse {
  data: {
    transfers: {
      tokenAmountUsdc: Integer;
    }[];
  };
}
