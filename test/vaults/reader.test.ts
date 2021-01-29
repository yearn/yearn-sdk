import "dotenv/config";

import { WebSocketProvider } from "@ethersproject/providers";

import { Context } from "../../src/data/context";
import { fetchInceptionBlock } from "../../src/vault";
import { vaults } from "../testdata";

describe("", () => {
  let provider: WebSocketProvider;
  let ctx: Context;

  beforeAll(() => {
    provider = new WebSocketProvider(process.env.WEB3_PROVIDER ?? "");
    ctx = new Context({ provider, etherscan: process.env.ETHERSCAN_KEY });
  });

  it("should find the correct inception block (network)", () => {
    const inception = fetchInceptionBlock(vaults.v1.object, ctx);
    return expect(inception).resolves.toEqual({
      block: vaults.v1.inception,
      timestamp: expect.any(Number)
    });
  }, 10000);

  it("should find the correct inception block (network)", () => {
    const inception = fetchInceptionBlock(vaults.v2.object, ctx);
    return expect(inception).resolves.toEqual({
      block: vaults.v2.inception,
      timestamp: expect.any(Number)
    });
  }, 10000);

  afterAll(() => {
    return provider.destroy();
  });
});
