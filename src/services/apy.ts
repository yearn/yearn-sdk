import { handleHttpError } from "../helpers";
import { Address, Service } from "../common";

export interface Apy {
  recommended: number;
  composite: boolean;
  type: string;
  description: string;
  data?: Record<string, unknown>;
}

/**
 * // TODO:
 * - refactor Apy interface
 * - apy API with option to address single vault
 */

type ApiVault = Record<string, unknown>;

/**
 * [[ApyService]] provides access to off chain apy calculations for yearn
 * products.
 */
export class ApyService extends Service {
  async get(address: Address): Promise<Apy | undefined> {
    const url = "//vaults.finance/all";
    const vaults = await fetch(url)
      .then(handleHttpError)
      .then(res => res.json());
    const vault = vaults.find((vault: ApiVault) => vault.address === address);
    if (!vault) return;
    return vault.apy;
  }
}
