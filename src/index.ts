/**
 * Welcome to the Yearn SDK documentation.
 *
 * ## Yearn namespace
 *
 * [[Yearn]]
 *
 * ## Readers
 *
 * - [[VaultReader]]
 * - [[IronBankReader]]
 * - [[TokenReader]]
 * - [[EarningsReader]]
 *
 * ## Services
 *
 * SDK is divided in services representing the different data sources for
 * yearn products and the access method used to read / write from them.
 *
 * - [[LensService]] provides access to yearn's assets and user position.
 * -→ [[RegistryV2Adapter]]
 * -→ [[IronBankAdapter]]
 * - [[OracleService]] is the main pricing engine used for all calculations.
 * - [[ZapperService]]
 * - [[VisionService]]
 * - [[SubgraphService]]
 *
 *
 * ### Peer dependencies
 *
 * SDK requires several dependencies from the ethers.js project.
 *
 * @module
 */

import "cross-fetch/polyfill";

export { LensService } from "./services/lens";
export { RegistryV2Adapter } from "./services/adapters/registry";
export { IronBankAdapter } from "./services/adapters/ironbank";
export { OracleService } from "./services/oracle";
export { ZapperService } from "./services/zapper";
export { VisionService } from "./services/vision";
export { SubgraphService } from "./services/subgraph";

export { VaultReader } from "./readers/vault";
export { IronBankReader } from "./readers/ironbank";
export { TokenReader } from "./readers/token";
export { EarningsReader } from "./readers/earnings";

export { Yearn } from "./yearn";

export { ChainId } from "./chain";

export * from "./types";
