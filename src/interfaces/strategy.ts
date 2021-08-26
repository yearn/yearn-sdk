import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { Address } from "../types";
import { VaultStrategyData } from "../types/strategy";

interface VaultData {
  address: Address;
  token: {
    symbol: string;
  };
  strategies: {
    name: string;
    address: Address;
  }[];
}

const VaultAbi = [
  "function strategies(address) view returns (uint256 performanceFee, uint256 activation, uint256 debtRatio, uint256 rateLimit, uint256 lastReport, uint256 totalDebt, uint256 totalGain, uint256 totalLoss)"
];

export class StrategyInterface<T extends ChainId> extends ServiceInterface<T> {
  async dataForVaults(vaults: Address[]): Promise<VaultStrategyData[]> {
    const vaultData = await this.fetchVaultData();

    let fetchData: Promise<VaultStrategyData | undefined>[];
    if (vaults) {
      fetchData = vaults.map(async vault => {
        const vaultDatum = vaultData.find(data => data.address === vault);
        if (!vaultDatum) {
          return undefined;
        }
        return this.fetchDataForVault(vault, vaultDatum);
      });
    } else {
      fetchData = vaultData.map(async vaultData => {
        return this.fetchDataForVault(vaultData.address, vaultData);
      });
    }

    return Promise.all(fetchData).then(vaultsStrategyData => {
      return vaultsStrategyData.flatMap(data => (data ? [data] : []));
    });
  }

  async dataForVault(vault: Address): Promise<VaultStrategyData | undefined> {
    const vaultData = await this.fetchVaultData().then(vaultData => vaultData.find(data => data.address === vault));
    if (!vaultData) {
      return undefined;
    }
    return this.fetchDataForVault(vault, vaultData);
  }

  private async fetchDataForVault(vault: Address, vaultData: VaultData): Promise<VaultStrategyData | undefined> {
    const provider = this.ctx.provider.read;
    const vaultContract = new Contract(vault, VaultAbi, provider);

    if (vaultData.strategies.length === 0) {
      return undefined;
    }

    let metadata = await Promise.all(
      vaultData.strategies.map(async strategy => {
        let debtRatio: BigNumber;

        try {
          const struct = await vaultContract.strategies(strategy.address);
          debtRatio = struct.debtRatio as BigNumber;
        } catch (error) {
          return undefined;
        }

        if (debtRatio.lte(BigNumber.from("0"))) {
          return undefined;
        }

        return this.yearn.services.meta.strategy(strategy.address).then(metadata => {
          const description = metadata?.description.replace(/{{token}}/g, vaultData.token.symbol);

          return {
            name: metadata?.name || strategy.name,
            description: description || "I don't have a description for this strategy yet",
            debtRatio: debtRatio.toString()
          };
        });
      })
    ).then(metadatas => metadatas.flatMap(metadata => (metadata ? [metadata] : [])));

    if (metadata.length === 0) {
      return undefined;
    }

    metadata.sort((lhs, rhs) => parseInt(rhs.debtRatio) - parseInt(lhs.debtRatio));
    return {
      address: vault,
      data: metadata
    };
  }

  private async fetchVaultData(): Promise<VaultData[]> {
    return await fetch("https://d28fcsszptni1s.cloudfront.net/v1/chains/1/vaults/all").then(res => res.json());
  }
}
