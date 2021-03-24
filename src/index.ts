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

import { Provider } from "@ethersproject/providers";

import { Lens, Asset, Position } from "./lens";
import { Oracle } from "./oracle";

import { ChainId } from "./chain";

export class Yearn {
  lens: Lens;
  oracle: Oracle;

  constructor(chainId: ChainId, provider: Provider) {
    this.lens = new Lens(chainId, provider);
    this.oracle = new Oracle(chainId, provider);
  }
}

export { Lens, Asset, Position, Oracle, ChainId };
