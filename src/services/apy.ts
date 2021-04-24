import { handleHttpError } from "../helpers";
import { Address, Service } from "../common";
import { Apy } from "../types";

type ApiVault = Record<string, unknown>;

/**
 * [[ApyService]] provides access to off chain apy calculations for yearn
 * products.
 */
export class ApyService extends Service {
  async get(address: Address): Promise<Apy | undefined> {
    const url = "https://vaults.finance/all";
    const vaults = await fetch(url)
      .then(handleHttpError)
      .then(res => res.json());
    const vault = vaults.find((vault: ApiVault) => vault.address === address);
    if (!vault) return;
    return vault.apy;
  }
}
