import { ChainId } from "./chain";
import { Context, ContextValue } from "./context";
import { TokenReader } from "./readers/token";
import { VaultReader } from "./readers/vault";
import { VisionService } from "./services/vision";
import { LensService } from "./services/lens";
import { OracleService } from "./services/oracle";
import { ZapperService } from "./services/zapper";
import { IconsService } from "./services/icons";
import { SubgraphService } from "./services/subgraph";
import { EarningsReader } from "./readers/earnings";
import { IronBankReader } from "./readers/ironbank";
import { HelperService } from "./services/helper";

/**
 * [[Yearn]] is a wrapper for all the services and interfaces of the SDK.
 *
 * Yearn namespace can be instantiated as a class, providing configuration
 * options that will then be used by all the services and interfaces:
 *
 * ```typescript
 * import { Yearn } from "@yfi/sdk";
 *
 * const provider = new JsonRpcProvider("http://localhost:8545");
 * const yearn = new Yearn(1, { provider });
 * ```
 */
export class Yearn<T extends ChainId> {
  services: {
    lens: LensService<T>;
    oracle: OracleService<T>;
    zapper: ZapperService;
    icons: IconsService;
    vision: VisionService;
    subgraph: SubgraphService;

    helper: HelperService<T>;
  };

  vaults: VaultReader<T>;
  tokens: TokenReader<T>;
  earnings: EarningsReader<T>;
  ironBank: IronBankReader<T>;

  context: Context;

  /**
   * This promise can be **optionally** awaited to assure that all services
   * have been correctly loaded.
   *
   * ```typescript
   * const yearn = new Yearn(1, { provider });
   * await yearn.ready;
   * ```
   */
  ready: Promise<void[]>;

  /**
   * Create a new SDK instance.
   * @param chainId
   * @param context plain object containing all the optional configuration
   */
  constructor(chainId: T, context: ContextValue) {
    this.context = new Context(context);

    this.services = {
      lens: new LensService(chainId, this.context),
      oracle: new OracleService(chainId, this.context),
      zapper: new ZapperService(chainId, this.context),
      icons: new IconsService(chainId, this.context),
      vision: new VisionService(chainId, this.context),
      subgraph: new SubgraphService(chainId, this.context),
      helper: new HelperService(chainId, this.context)
    };

    this.vaults = new VaultReader(this, chainId, this.context);
    this.tokens = new TokenReader(this, chainId, this.context);
    this.earnings = new EarningsReader(this, chainId, this.context);
    this.ironBank = new IronBankReader(this, chainId, this.context);

    this.ready = Promise.all([this.services.icons.ready]);
  }
}
