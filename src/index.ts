/**
 * Welcome to the Yearn SDK documentation.
 *
 * ## Modules
 *
 * SDK is divided in modules representing the different services offered by
 * yearn and the access method used to read / write from them.
 *
 * - [[Lens]] provides access to yearn's assets and user position.
 * - [[Oracle]] is the main pricing engine used for all calculations.
 *
 * ## Peer dependencies
 *
 * SDK requires several dependencies from the ethers.js project.
 *
 * @module
 */

export { Lens, Asset, Position } from "./provider/lens";
export { Oracle } from "./provider/oracle";

export { VaultInterface, Vault } from "./interface/vault";

export { Yearn } from "./yearn";

export { ChainId } from "./chain";
