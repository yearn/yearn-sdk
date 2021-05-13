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
import { SubgraphService } from "./services/subgraph";
import { EarningsReader } from "./readers/earnings";
import { IronBankReader } from "./readers/ironbank";
import { HelperService } from "./services/helper";

export class Yearn<T extends ChainId> {
  services: {
    lens: LensService<T>;
    oracle: OracleService<T>;
    zapper: ZapperService;
    icons: IconsService;
    apy: ApyService;
    subgraph: SubgraphService;

    helper: HelperService<T>;
  };

  vaults: VaultReader<T>;
  tokens: TokenReader<T>;
  earnings: EarningsReader<T>;
  ironBank: IronBankReader<T>;

  ready: Promise<void[]>;

  constructor(chainId: T, context: ContextValue, cache?: Cache) {
    const ctx = new Context(context, cache);

    this.services = {
      lens: new LensService(chainId, ctx),
      oracle: new OracleService(chainId, ctx),
      zapper: new ZapperService(chainId, ctx),
      icons: new IconsService(chainId, ctx),
      apy: new ApyService(chainId, ctx),
      subgraph: new SubgraphService(chainId, ctx),
      helper: new HelperService(chainId, ctx)
    };

    this.vaults = new VaultReader(this, chainId, ctx);
    this.tokens = new TokenReader(this, chainId, ctx);
    this.earnings = new EarningsReader(this, chainId, ctx);
    this.ironBank = new IronBankReader(this, chainId, ctx);

    this.ready = Promise.all([this.services.icons.ready]);
  }
}
