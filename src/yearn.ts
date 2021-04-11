import { ChainId } from "./chain";
import { Context, ContextValue } from "./context";
import { TokenReader } from "./readers/token";
import { VaultReader } from "./readers/vault";
import { ApyService } from "./services/apy";
import { LensService } from "./services/lens";
import { OracleService } from "./services/oracle";
import { ZapperService } from "./services/zapper";

export class Yearn<T extends ChainId> {
  services: {
    lens: LensService<T>;
    oracle: OracleService<T>;
    zapper: ZapperService;
    apy: ApyService;
  };

  vaults: VaultReader<T>;
  tokens: TokenReader<T>;

  constructor(chainId: T, context: ContextValue) {
    const ctx = new Context(context);

    this.services = {
      lens: new LensService(chainId, ctx),
      oracle: new OracleService(chainId, ctx),
      zapper: new ZapperService(chainId, ctx),
      apy: new ApyService(chainId, ctx)
    };

    this.vaults = new VaultReader(this, chainId, ctx);
    this.tokens = new TokenReader(this, chainId, ctx);
  }
}
