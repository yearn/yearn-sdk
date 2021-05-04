import { BigNumber } from "@ethersproject/bignumber";
import { ChainId } from "../chain";
import { Address, Integer, Reader, Usdc } from "../common";
import { TokenAmount } from "../types";

interface Vault {
  token: Token;
  latestUpdate: LatestUpdate;
}

interface Token {
  id: Address;
  decimals: Integer;
}

interface LatestUpdate {
  returnsGenerated: Integer;
}

export interface AssetEarnings extends Earnings {
  assetId: Address;
}

export interface Earnings extends TokenAmount {
  tokenId: Address;
}

export class EarningsReader<C extends ChainId> extends Reader<C> {
  async protocolEarnings(): Promise<Usdc> {
    interface VaultsContainer {
      vaults: Vault[];
    }
    const query = `
    {
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

    const response: VaultsContainer = await this.yearn.services.subgraph.performQuery(
      query
    );
    var result = BigNumber.from(0);
    for (const vault of response.vaults) {
      if (vault.latestUpdate === null) {
        continue;
      }
      const returnsGenerated = BigNumber.from(
        vault.latestUpdate.returnsGenerated
      );
      const earningsUsdc = await this.tokensValueInUsdc(
        returnsGenerated,
        vault.token
      );
      // TODO - some results are negative, and some are too large to be realistically possible. This is due to problems with the subgraph and should be fixed there
      const oneHundredMillionUsd = BigNumber.from(100000000000000);
      if (
        earningsUsdc.gt(BigNumber.from(0)) &&
        earningsUsdc.lt(oneHundredMillionUsd)
      ) {
        result = result.add(earningsUsdc);
      }
    }

    return result.toString();
  }

  async assetEarnings(vaultAddress: Address): Promise<AssetEarnings> {
    interface VaultDataContainer {
      vault: Vault;
    }

    const query = `
    {
      vault(id: "${vaultAddress.toLowerCase()}") {
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
    const response: VaultDataContainer = await this.yearn.services.subgraph.performQuery(
      query
    );
    const vault = response.vault;
    const returnsGenerated = BigNumber.from(
      vault.latestUpdate.returnsGenerated
    );
    const earningsUsdc = await this.tokensValueInUsdc(
      returnsGenerated,
      vault.token
    );
    const result: AssetEarnings = {
      assetId: vaultAddress,
      amount: vault.latestUpdate.returnsGenerated,
      amountUsdc: earningsUsdc.toString(),
      tokenId: vault.token.id
    };
    return result;
  }

  private async tokensValueInUsdc(
    tokenAmount: BigNumber,
    token: Token
  ): Promise<BigNumber> {
    const tokenUsdcPrice = await this.yearn.services.oracle.getPriceUsdc(
      token.id
    );
    return BigNumber.from(tokenUsdcPrice)
      .mul(tokenAmount)
      .div(BigNumber.from(10).pow(BigNumber.from(token.decimals)));
  }
}
