import { ChainId } from "./chain";
import { Context, ContextValue } from "./context";
import { VaultReader } from "./readers/vault";
import { LensService } from "./services/lens";
import { OracleService } from "./services/oracle";
import { ZapperService } from "./services/zapper";

export class Yearn<T extends ChainId> {
  services: {
    lens: LensService<T>;
    oracle: OracleService<T>;
    zapper: ZapperService;
  };

  vaults: VaultReader<T>;

  constructor(chainId: T, context: Context | ContextValue) {
    // typescript at its best :/
    let ctx;
    if (!(context instanceof Context)) ctx = new Context(context);
    else ctx = context;

    this.services = {
      lens: new LensService(chainId, ctx),
      oracle: new OracleService(chainId, ctx),
      zapper: new ZapperService(chainId, ctx)
    };

    this.vaults = new VaultReader(this, chainId, ctx);
  }
}
