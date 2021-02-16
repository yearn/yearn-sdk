import "dotenv/config";

import { WebSocketProvider } from "@ethersproject/providers";

import { Context } from "../../../src/data/context";
import { resolveV1, resolveV2 } from "../../../src/protocols/yearn/vault";
import { vaults } from "./testdata";

describe("resolver", () => {
  let provider: WebSocketProvider;
  let ctx: Context;

  beforeAll(() => {
    provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS ?? "");
    ctx = new Context({ provider, etherscan: process.env.ETHERSCAN_KEY });
  });

  it("should resolve a v1 vault (network)", async () => {
    const vault = resolveV1(vaults.v1.address, ctx);
    return expect(vault).resolves.toMatchObject(vaults.v1.object);
  }, 1e4);

  it("should resolve a v2 vault (network)", () => {
    const vault = resolveV2(vaults.v2.address, ctx);
    return expect(vault).resolves.toEqual(vaults.v2.object);
  });

  afterAll(() => {
    return provider.destroy();
  }, 1e4);
});
