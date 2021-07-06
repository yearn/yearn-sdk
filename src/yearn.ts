import { ChainId } from "./chain";
import { Context, ContextValue } from "./context";
import { EarningsInterface } from "./interfaces/earnings";
import { FeesInterface } from "./interfaces/fees";
import { IronBankInterface } from "./interfaces/ironbank";
import { SimulationInterface } from "./interfaces/simulation";
import { TokenInterface } from "./interfaces/token";
import { VaultInterface } from "./interfaces/vault";
import { HelperService } from "./services/helper";
import { IconsService } from "./services/icons";
import { LensService } from "./services/lens";
import { OracleService } from "./services/oracle";
import { SubgraphService } from "./services/subgraph";
import { VisionService } from "./services/vision";
import { ZapperService } from "./services/zapper";

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

  vaults: VaultInterface<T>;
  tokens: TokenInterface<T>;
  earnings: EarningsInterface<T>;
  fees: FeesInterface<T>;
  ironBank: IronBankInterface<T>;
  simulation: SimulationInterface<T>;

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

    this.vaults = new VaultInterface(this, chainId, this.context);
    this.tokens = new TokenInterface(this, chainId, this.context);
    this.earnings = new EarningsInterface(this, chainId, this.context);
    this.fees = new FeesInterface(this, chainId, this.context);
    this.ironBank = new IronBankInterface(this, chainId, this.context);
    this.simulation = new SimulationInterface(this, chainId, this.context);

    this.ready = Promise.all([this.services.icons.ready]);
  }
}
