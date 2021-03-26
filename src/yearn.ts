import { Provider } from "@ethersproject/providers";

import { ChainId } from "./chain";
import { VaultInterface } from "./interface/vault";
import { Lens } from "./provider/lens";
import { Oracle } from "./provider/oracle";

export class Yearn {
  providers: {
    lens: Lens;
    oracle: Oracle;
  };

  vaults: VaultInterface;

  constructor(chainId: ChainId, provider: Provider) {
    this.providers = {
      lens: new Lens(chainId, provider),
      oracle: new Oracle(chainId, provider)
    };

    this.vaults = new VaultInterface(this, chainId, provider);
  }
}
