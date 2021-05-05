import { BigNumber } from "@ethersproject/bignumber";
import { ProtocolEarnings } from "../apollo/generated/ProtocolEarnings";
import { VaultEarnings, VaultEarningsVariables } from "../apollo/generated/VaultEarnings";
import { PROTOCOL_EARNINGS, VAULT_EARNINGS } from "../apollo/queries";
import { ChainId } from "../chain";
import { Address, Reader, Usdc } from "../common";
import { TokenAmount } from "../types";

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
      // TODO - some results are negative, and some are too large to be realistically possible. This is due to problems with the subgraph and should be fixed there - https://github.com/yearn/yearn-vaults-v2-subgraph/issues/60
      const oneHundredMillionUsd = BigNumber.from(100000000000000);
      if (earningsUsdc.gt(BigNumber.from(0)) && earningsUsdc.lt(oneHundredMillionUsd)) {
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

    if (vault == undefined) {
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
