import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import fetch from "cross-fetch";

import { CachedFetcher } from "../cache";
import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { Address, StrategyMetadata } from "../types";
import { VaultStrategiesMetadata } from "../types/strategy";

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
  "function strategies(address) view returns (uint256 performanceFee, uint256 activation, uint256 debtRatio, uint256 rateLimit, uint256 lastReport, uint256 totalDebt, uint256 totalGain, uint256 totalLoss)",
  "function token() view returns (address)",
  "event StrategyAdded(address indexed strategy, uint256 debtRatio, uint256 minDebtPerHarvest, uint256 maxDebtPerHarvest, uint256 performanceFee)"
];

const TokenAbi = ["function symbol() view returns (string)"];

export class StrategyInterface<T extends ChainId> extends ServiceInterface<T> {
  private cachedFetcher = new CachedFetcher<VaultStrategiesMetadata[]>(
    "strategies/metadata/get",
    this.ctx,
    this.chainId
  );

  async vaultsStrategiesMetadata(vaultAddresses?: Address[]): Promise<VaultStrategiesMetadata[]> {
    const cached = await this.cachedFetcher.fetch();
    if (cached) {
      return cached;
    }

    let vaults: Address[];
    if (vaultAddresses) {
      vaults = vaultAddresses;
    } else {
      vaults = await this.yearn.services.lens.adapters.vaults.v2
        .assetsStatic()
        .then(assets => assets.map(asset => asset.address));
    }

    // Read from the api if it's available, as it's quicker.
    // Otherwise read from chain
    if (this.chainId === 1 || this.chainId === 1337) {
      return this.fetchMetadataFromApi(vaults);
    } else {
      return this.fetchMetadataFromChain(vaults);
    }
  }

  async fetchMetadataFromApi(vaultAddresses: Address[]): Promise<VaultStrategiesMetadata[]> {
    const vaultsData = await this.fetchVaultsData();

    const strategiesMetadata = await this.yearn.services.meta.strategies();

    let vaultsStrategiesMetadataPromises: Promise<VaultStrategiesMetadata | undefined>[];
    vaultsStrategiesMetadataPromises = vaultAddresses.map(async vaultAddress => {
      const vaultDatum = vaultsData.find(datum => datum.address === vaultAddress);
      if (!vaultDatum) {
        return undefined;
      }
      const vaultContract = new Contract(vaultDatum.address, VaultAbi, this.ctx.provider.read);
      return this.fetchVaultStrategiesMetadata(
        vaultDatum.strategies,
        strategiesMetadata,
        vaultContract,
        vaultDatum.token.symbol
      );
    });

    return Promise.all(vaultsStrategiesMetadataPromises).then(vaultsStrategyData => {
      return vaultsStrategyData.flatMap(data => (data ? [data] : []));
    });
  }

  async fetchMetadataFromChain(vaultAddresses: Address[]): Promise<VaultStrategiesMetadata[]> {
    const strategiesMetadata = await this.yearn.services.meta.strategies();
    const provider = this.ctx.provider.read;

    let vaultsStrategiesMetadataPromises: Promise<VaultStrategiesMetadata | undefined>[];
    vaultsStrategiesMetadataPromises = vaultAddresses.map(async vaultAddress => {
      const vaultContract = new Contract(vaultAddress, VaultAbi, provider);

      const strategiesPromise = this.yearn.services.helper.assetStrategiesAddresses(vaultAddress).then(addresses =>
        addresses.map(strat => {
          return {
            address: strat
          };
        })
      );

      const [strategies, underlyingTokenAddress] = await Promise.all([strategiesPromise, vaultContract.token()]);
      const underlyingTokenContract = new Contract(underlyingTokenAddress, TokenAbi, provider);
      const underlyingTokenSymbol = await underlyingTokenContract.symbol();

      return this.fetchVaultStrategiesMetadata(strategies, strategiesMetadata, vaultContract, underlyingTokenSymbol);
    });

    return Promise.all(vaultsStrategiesMetadataPromises).then(vaultsStrategyData =>
      vaultsStrategyData.flatMap(data => (data ? [data] : []))
    );
  }

  private async fetchVaultStrategiesMetadata(
    strategies: { address: Address; name?: string }[],
    strategiesMetadata: StrategyMetadata[],
    vaultContract: Contract,
    underlyingTokenSymbol: string
  ): Promise<VaultStrategiesMetadata | undefined> {
    if (strategies.length === 0) {
      return undefined;
    }

    let metadata: StrategyMetadata[] = await Promise.all(
      strategies.map(async strategy => {
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

        const emptyMetadata: StrategyMetadata = {
          address: strategy.address,
          name: strategy.name || "Strategy",
          description: "I don't have a description for this strategy yet",
          protocols: []
        };

        const metadata = strategiesMetadata.find(meta => meta.address === strategy.address) ?? emptyMetadata;

        metadata.description = metadata?.description.replace(/{{token}}/g, underlyingTokenSymbol);

        return { data: metadata, debtRatio };
      })
    ).then(metadataAndDebtRatio =>
      metadataAndDebtRatio
        .flatMap(data => (data ? [data] : []))
        .sort((lhs, rhs) => {
          if (lhs.debtRatio.lt(rhs.debtRatio)) {
            return 1;
          } else if (lhs.debtRatio.eq(rhs.debtRatio)) {
            return 0;
          } else {
            return -1;
          }
        })
        .map(metadata => metadata.data)
    );

    if (metadata.length === 0) {
      return undefined;
    }

    const result: VaultStrategiesMetadata = {
      vaultAddress: vaultContract.address,
      strategiesMetadata: metadata
    };

    return result;
  }

  private async fetchVaultsData(): Promise<VaultData[]> {
    return fetch("https://d28fcsszptni1s.cloudfront.net/v1/chains/1/vaults/all").then(res => res.json());
  }
}
