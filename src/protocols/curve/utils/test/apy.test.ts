import "dotenv/config";

import { WebSocketProvider } from "@ethersproject/providers";

import { Context } from "../../../../data/context";
import utils from "../";

describe("", () => {
  let provider: WebSocketProvider;
  let ctx: Context;

  beforeAll(() => {
    provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS ?? "");
    ctx = new Context({ provider, etherscan: process.env.ETHERSCAN_KEY });
  });

  it("should find the correct inception block (network)", async () => {
    const apy = await utils.calculateApy(
      "0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900",
      ctx
    );
    // console.log("apy,", apy);
    return expect(apy).toEqual({
      recommended: expect.any(Number),
      composite: expect.any(Boolean),
      type: expect.any(String),
      description: expect.any(String),
      data: expect.any(Object)
    });
  }, 30000);

  afterAll(() => {
    return provider.destroy();
  });
});
