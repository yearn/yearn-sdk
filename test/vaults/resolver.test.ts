import "dotenv/config";

import { WebSocketProvider } from "@ethersproject/providers";

import { Context } from "../../src/data/context";
import { resolveV1, resolveV2 } from "../../src/vault/resolver";
import { vaults } from "../testdata";

describe("resolver", () => {
  let provider: WebSocketProvider;
  let ctx: Context;

  beforeAll(() => {
    provider = new WebSocketProvider(process.env.WEB3_PROVIDER ?? "");
    ctx = new Context({ provider, etherscan: process.env.ETHERSCAN_KEY });
  });

  it("should resolve a v1 vault (network)", async () => {
    const vault = resolveV1(vaults.v1.address, ctx);
    return expect(vault).resolves.toMatchObject(vaults.v1.object);
  });

  it("should resolve a v2 vault (network)", () => {
    const vault = resolveV2(vaults.v2.address, ctx);
    return expect(vault).resolves.toMatchObject(vaults.v2.object);
  });

  afterAll(() => {
    return provider.destroy();
  });
});
