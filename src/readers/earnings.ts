import { BigNumber } from "@ethersproject/bignumber";

import { ProtocolEarnings } from "../services/subgraph/apollo/generated/ProtocolEarnings";
import { VaultEarnings, VaultEarningsVariables } from "../services/subgraph/apollo/generated/VaultEarnings";
import { PROTOCOL_EARNINGS, VAULT_EARNINGS } from "../services/subgraph/apollo/queries";

import { ChainId } from "../chain";
import { Reader } from "../common";
import { Address, TokenAmount, Usdc } from "../types";

const OneHundredMillionUsdc = BigNumber.from(1e14); // 1e8 (100M) * 1e6 (Usdc decimals)

export interface AssetEarnings extends Earnings {
  assetId: Address;
}

export interface Earnings extends TokenAmount {
  tokenId: Address;
}

export class EarningsReader<C extends ChainId> extends Reader<C> {
  async protocolEarnings(): Promise<Usdc> {
    const response = await this.yearn.services.subgraph.client.query<ProtocolEarnings>({
      query: PROTOCOL_EARNINGS
    });

    var result = BigNumber.from(0);
    for (const vault of response.data.vaults) {
      if (vault.latestUpdate === null) {
        continue;
      }
      const returnsGenerated = BigNumber.from(vault.latestUpdate.returnsGenerated);
      const earningsUsdc = await this.tokensValueInUsdc(returnsGenerated, vault.token.id, vault.token.decimals);
      // FIXME: some results are negative, and some are too large to be realistically possible.
      // This is due to problems with the subgraph and should be fixed there:
      // https://github.com/yearn/yearn-vaults-v2-subgraph/issues/60
      if (earningsUsdc.gt(BigNumber.from(0)) && earningsUsdc.lt(OneHundredMillionUsdc)) {
        result = result.add(earningsUsdc);
      }
    }

    return result.toString();
  }

  async assetEarnings(vaultAddress: Address): Promise<AssetEarnings> {
    const response = await this.yearn.services.subgraph.client.query<VaultEarnings, VaultEarningsVariables>({
      query: VAULT_EARNINGS,
      variables: {
        vault: vaultAddress
      }
    });

    const vault = response.data.vault;

    if (!vault) {
      throw Error(`failed to find vault with address ${vaultAddress}`);
    }

    const returnsGenerated = BigNumber.from(vault.latestUpdate?.returnsGenerated);
    const earningsUsdc = await this.tokensValueInUsdc(returnsGenerated, vault.token.id, vault.token.decimals);
    const result: AssetEarnings = {
      assetId: vaultAddress,
      amount: vault.latestUpdate?.returnsGenerated || "",
      amountUsdc: earningsUsdc.toString(),
      tokenId: vault.token.id
    };
    return result;
  }

  private async tokensValueInUsdc(tokenAmount: BigNumber, tokenAddress: Address, decimals: number): Promise<BigNumber> {
    const tokenUsdcPrice = await this.yearn.services.oracle.getPriceUsdc(tokenAddress);
    return BigNumber.from(tokenUsdcPrice)
      .mul(tokenAmount)
      .div(BigNumber.from(10).pow(BigNumber.from(decimals)));
  }
}
