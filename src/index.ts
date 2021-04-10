/**
 * Welcome to the Yearn SDK documentation.
 *
 * ## Modules
 *
 * SDK is divided in modules representing the different services offered by
 * yearn and the access method used to read / write from them.
 *
 * - [[LensService]] provides access to yearn's assets and user position.
 * - [[OracleService]] is the main pricing engine used for all calculations.
 *
 * ## Peer dependencies
 *
 * SDK requires several dependencies from the ethers.js project.
 *
 * @module
 */

import "cross-fetch/polyfill";

export { LensService } from "./services/lens";
export { OracleService } from "./services/oracle";
export {
  ZapperService,
  Balance,
  BalancesMap,
  GasPrice
} from "./services/zapper";
export { ApyService, Apy } from "./services/apy";

export { VaultReader } from "./readers/vault";
export { TokenReader } from "./readers/token";

export { Yearn } from "./yearn";

export { ChainId } from "./chain";

export * from "./types";
