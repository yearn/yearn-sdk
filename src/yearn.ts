import { Provider } from "@ethersproject/providers";

import { ChainId } from "./chain";
import { VaultReader } from "./readers/vault";
import { LensProvider } from "./providers/lens";
import { OracleProvider } from "./providers/oracle";

export class Yearn<T extends ChainId> {
  providers: {
    lens: LensProvider<T>;
    oracle: OracleProvider<T>;
  };

  vaults: VaultReader<T>;

  constructor(chainId: T, provider: Provider) {
    this.providers = {
      lens: new LensProvider(chainId, provider),
      oracle: new OracleProvider(chainId, provider)
    };

    this.vaults = new VaultReader(this, chainId, provider);
  }
}
