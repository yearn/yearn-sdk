import "dotenv/config";

import { WebSocketProvider } from "@ethersproject/providers";

import { Context } from "../../../src/data/context";
import {
  fetchV1Addresses,
  fetchV2Addresses,
  fetchV2ExperimentalAddresses
} from "../../../src/protocols/yearn/vault";

describe("registry", () => {
  let provider: WebSocketProvider;
  let ctx: Context;

  beforeAll(() => {
    provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS ?? "");
    ctx = new Context({ provider, etherscan: process.env.ETHERSCAN_KEY });
  });

  it("should fetch a list of v1 addresses (network)", () => {
    const length = fetchV1Addresses(ctx).then(({ length }) => length);
    return expect(length).resolves.toBeGreaterThan(0);
  });

  it("should fetch a list of v2 addresses (network)", () => {
    const length = fetchV2Addresses(ctx).then(({ length }) => length);
    return expect(length).resolves.toBeGreaterThan(0);
  });

  it("should fetch a list of v2 experimental addresses (network)", () => {
    const length = fetchV2ExperimentalAddresses(ctx).then(({ length }) => length);
    return expect(length).resolves.toBeGreaterThan(0);
  });

  afterAll(() => {
    return provider.destroy();
  });
});
