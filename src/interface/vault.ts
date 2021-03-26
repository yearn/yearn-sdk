import { Provider } from "@ethersproject/providers";

import { Yearn } from "../yearn";
import { ChainId } from "../chain";
import { Address, Interface } from "../common";

import { Asset } from "../provider/lens";

export interface Vault extends Asset {}

export class VaultInterface extends Interface {
  adapterAddresses: Address[];

  constructor(yearn: Yearn, chainId: ChainId, provider: Provider) {
    super(yearn, chainId, provider);
    this.adapterAddresses = VaultInterface.getAdapterAddresses(chainId);
  }

  static getAdapterAddresses(chainId: ChainId): string[] {
    switch (chainId) {
      case 250:
        return ["0x79f0582251586fc6559e0a30c46f822488c7553b"];
    }
    throw new TypeError(`No vault adapters for chainId ${chainId}`);
  }

  async get(): Promise<Vault[]> {
    return await Promise.all(
      this.adapterAddresses.map(address => {
        return this.yearn.providers.lens.getAssetsFromAdapter(address);
      })
    ).then(arr => arr.flat());
  }
}
