import { ChainId } from "../chain";
import { Address, Integer, Reader, Usdc } from "../common";
import { TokenAmount } from "../types";

interface VaultsContainer {
  vaults: Vault[];
}

interface Vault {
  id: Address;
  balanceTokens: Integer;
  sharesSupply: Integer;
  token: Token;
  latestUpdate: LatestUpdate;
}

interface Token {
  id: Address;
  symbol: String;
  decimals: Integer;
}

interface LatestUpdate {
  pricePerShare: Integer;
}

export interface AssetEarnings extends Earnings {
  assetId: Address;
}

export interface Earnings extends TokenAmount {
  tokenId: Address;
}

export class EarningsReader<C extends ChainId> extends Reader<C> {
  // note - the subgraph only has information about V2 vaults
  async protocolEarnings(): Promise<Usdc> {
    const query = `
    {
      vaults(where:{balanceTokens_gt:0}) {
        id
        balanceTokens
        token {
          symbol
          id
          decimals
        }
        latestUpdate {
          pricePerShare
        }
        sharesSupply
      }
    }
    `;
    const response: VaultsContainer = await this.yearn.services.subgraph.performQuery(
      query
    );

    var result = 0;
    for (const vault of response.vaults) {
      const earnings = calculateEarningsForVault(vault);
      const earningsUsdc = await this.tokensValueInUsdc(earnings, vault.token);
      // TODO - some results are negative, and some are too large to be realistically possible. This is due to problems with the subgraph and should be fixed there
      if (earningsUsdc > 0 && earningsUsdc < 1000000000) {
        result += earningsUsdc;
      }
    }

    return result.toFixed(0);
  }

  async assetEarnings(vaultAddress: Address): Promise<AssetEarnings> {
    interface VaultDataContainer {
      vault: Vault;
    }

    const query = `
    {
      vault(id: "${vaultAddress}") {
        id
        balanceTokens
        token {
          symbol
          id
          decimals
        }
        latestUpdate {
          pricePerShare
        }
        sharesSupply
      }
    }
    `;
    const response: VaultDataContainer = await this.yearn.services.subgraph.performQuery(
      query
    );
    const vault = response.vault;
    const earnings = calculateEarningsForVault(vault);
    const earningsUsdc = await this.tokensValueInUsdc(earnings, vault.token);
    const result: AssetEarnings = {
      assetId: vaultAddress,
      amount: earnings.toFixed(0),
      amountUsdc: earningsUsdc.toFixed(0),
      tokenId: vault.token.id
    };
    return result;
  }

  private async tokensValueInUsdc(
    tokenAmount: number,
    token: Token
  ): Promise<number> {
    const tokenUsdcPrice = await this.yearn.services.oracle.getPriceUsdc(
      token.id
    );
    return (+tokenUsdcPrice * tokenAmount) / 10 ** +token.decimals;
  }
}

function calculateEarningsForVault(vault: Vault): number {
  var pricePerShare: number =
    +vault.latestUpdate.pricePerShare / 10 ** +vault.token.decimals;
  const totalTokens = pricePerShare * +vault.sharesSupply;
  const earnedTokens = totalTokens - +vault.balanceTokens;
  return earnedTokens;
}
