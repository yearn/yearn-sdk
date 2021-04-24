import { ChainId } from "./chain";
import { Cache } from "./cache";
import { Context, ContextValue } from "./context";
import { TokenReader } from "./readers/token";
import { VaultReader } from "./readers/vault";
import { ApyService } from "./services/apy";
import { LensService } from "./services/lens";
import { OracleService } from "./services/oracle";
import { ZapperService } from "./services/zapper";
import { IconsService } from "./services/icons";

export class Yearn<T extends ChainId> {
  services: {
    lens: LensService<T>;
    oracle: OracleService<T>;
    zapper: ZapperService;
    icons: IconsService;
    apy: ApyService;
  };

  vaults: VaultReader<T>;
  tokens: TokenReader<T>;

  constructor(chainId: T, context: ContextValue, cache?: Cache) {
    const ctx = new Context(context, cache);

    this.services = {
      lens: new LensService(chainId, ctx),
      oracle: new OracleService(chainId, ctx),
      zapper: new ZapperService(chainId, ctx),
      icons: new IconsService(chainId, ctx),
      apy: new ApyService(chainId, ctx)
    };

    this.vaults = new VaultReader(this, chainId, ctx);
    this.tokens = new TokenReader(this, chainId, ctx);
  }
}
