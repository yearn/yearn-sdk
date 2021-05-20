/**
 * Welcome to the Yearn SDK documentation.
 *
 * ## Yearn namespace
 *
 * [[Yearn]] is a wrapper for all the services and interfaces of the SDK.
 *
 * ### Interfaces
 *
 * - [[VaultReader]] asset aggregation for yearn's v1 & v2 vaults.
 * - [[IronBankReader]] asset aggregation form iron bank products.
 * - [[TokenReader]] utility function for ERC20 and balances.
 * - [[EarningsReader]] historical earnings.
 *
 * ### Services
 *
 * SDK is divided in services representing the different data sources for
 * yearn products and the access method used to read / write from them.
 *
 * - [[LensService]]: provides access to yearn's assets and user position.
 * -→ [[RegistryV2Adapter]]: adapter of V2 vaults.
 * -→ [[IronBankAdapter]]: adapter of iron bank assets.
 * - [[OracleService]]: pricing engine used for calculations.
 * - [[ZapperService]]: interaction with zapper public API.
 * - [[VisionService]]: interaction with yearn's product stats aggregator.
 * - [[SubgraphService]]: interaction with yearn's subgraph
 *
 * ### Peer dependencies
 *
 * SDK requires several dependencies from the ethers.js project.
 *
 * @module
 */

// global fetch polyfill
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
export { Context, ContextValue } from "./context";

export { ChainId } from "./chain";

export * from "./types";
