import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { Address } from "../types";
import { StrategyData } from "../types/strategy";

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
  async dataForVaults(vaults: Address[]): Promise<Map<Address, StrategyData[]>> {
    let vaultData: VaultData[];
    try {
      vaultData = await this.fetchVaultData();
    } catch (error) {
      return new Map();
    }

    const containers = await Promise.all(
      vaults.map(async vault => {
        const vaultDatum = vaultData.find(data => data.address === vault);
        if (!vaultDatum) {
          return undefined;
        }
        const metadata = await this.fetchDataForVault(vault, vaultDatum);
        if (metadata) {
          return { vault, metadata };
        }
        return undefined;
      })
    );

    return containers
      .flatMap(container => (container ? [container] : []))
      .reduce((map, container) => {
        map.set(container.vault, container.metadata);
        return map;
      }, new Map<Address, StrategyData[]>());
  }

  async dataForVault(vault: Address): Promise<StrategyData[]> {
    const vaultData = await this.fetchVaultData().then(vaultData => vaultData.find(data => data.address === vault));
    if (!vaultData) {
      return [];
    }
    return this.fetchDataForVault(vault, vaultData);
  }

  private async fetchDataForVault(vault: Address, vaultData: VaultData): Promise<StrategyData[]> {
    const provider = this.ctx.provider.read;
    const vaultContract = new Contract(vault, VaultAbi, provider);

    let metadata = await Promise.all(
      vaultData.strategies.map(async strategy => {
        let debtRatio;

        try {
          const struct = await vaultContract.strategies(strategy.address);
          debtRatio = struct.debtRatio as BigNumber;
        } catch (error) {
          return undefined;
        }

        if (debtRatio.lte(BigNumber.from("0"))) {
          return undefined;
        }

        const metadata = await this.yearn.services.meta.strategy(strategy.address);
        const description = metadata?.description.replaceAll("{{token}}", vaultData.token.symbol);

        return {
          name: metadata?.name || strategy.name,
          description: description || "I don't have a description for this strategy yet",
          debtRatio: debtRatio.toString()
        };
      })
    ).then(metadatas => metadatas.flatMap(metadata => (metadata ? [metadata] : [])));

    metadata.sort((lhs, rhs) => parseInt(rhs.debtRatio) - parseInt(lhs.debtRatio));
    return metadata;
  }

  private async fetchVaultData(): Promise<VaultData[]> {
    return await fetch("https://d28fcsszptni1s.cloudfront.net/v1/chains/1/vaults/all").then(res => res.json());
  }
}
