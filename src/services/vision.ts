import { Service } from "../common";
import { handleHttpError } from "../helpers";
import { Address, Apy, ApyMap, BackscracherApyComposite } from "../types";

/**
 * Internal representation of a vault returned by the vaults.finance/all API.
 */
interface ApiVault {
  address: string;
  apy?: Apy;
}

/**
 * Fix for backscratcher vaults returning different casing and property names so it's all normalized.
 */
export function convertCompositeApyToSnakeCase(apy: Apy | undefined): Apy | undefined {
  return apy
    ? {
        ...apy,
        composite: apy.composite
          ? {
              ...apy.composite,
              boost: apy.composite.boost
                ? apy.composite.boost
                : ((apy.composite as unknown) as BackscracherApyComposite).currentBoost,
              pool_apy: apy.composite.pool_apy
                ? apy.composite.pool_apy
                : ((apy.composite as unknown) as BackscracherApyComposite).poolApy,
              boosted_apr: apy.composite.boosted_apr
                ? apy.composite.boosted_apr
                : ((apy.composite as unknown) as BackscracherApyComposite).boostedApy,
              base_apr: apy.composite.base_apr
                ? apy.composite.base_apr
                : ((apy.composite as unknown) as BackscracherApyComposite).baseApy
            }
          : null
      }
    : undefined;
}

/**
 * [[VisionService]] provides access to off chain apy calculations for yearn
 * products.
 */
export class VisionService extends Service {
  /**
   * Fetch APY from a list of yearn's vault addresses (or all of them is address
   * is not provided).
   * @param addresses
   */
  async apy<T extends Address>(addresses?: T[]): Promise<ApyMap<T>>;

  /**
   * Fetch API for a specific yearn's vault address.
   * @param addresses
   */
  async apy(address: Address): Promise<Apy | undefined>;

  async apy<T extends Address>(addresses?: T | T[]): Promise<ApyMap<T> | Apy | undefined> {
    const url = `https://d28fcsszptni1s.cloudfront.net/v1/chains/${this.chainId}/vaults/all`;
    let vaults: ApiVault[] = await fetch(url)
      .then(handleHttpError)
      .then(res => res.json());

    // fix backscratcher apys
    vaults = vaults.map(vault =>
      vault.apy && vault.apy.type === "backscratcher"
        ? { ...vault, apy: convertCompositeApyToSnakeCase(vault.apy) }
        : vault
    );

    if (Array.isArray(addresses)) {
      const map = new Map<T, Apy | undefined>();
      for (const address of addresses) {
        const vault = vaults.find(vault => vault.address === address);
        map.set(address, vault ? vault.apy : undefined);
      }
      return Object.fromEntries(map) as ApyMap<T>;
    } else if (addresses) {
      const vault = vaults.find(vault => vault.address === addresses);
      if (!vault) return undefined;
      return vault.apy;
    } else {
      return Object.fromEntries(vaults.map(vault => [vault.address, vault.apy])) as ApyMap<T>;
    }
  }
}
