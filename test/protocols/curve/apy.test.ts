import "dotenv/config";

import { Context } from "@data/context";
import { WebSocketProvider } from "@ethersproject/providers";
import { calculateApy } from "@protocols/curve";

const CurveVault = "0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900";

describe("", () => {
  let provider: WebSocketProvider;
  let ctx: Context;

  beforeAll(() => {
    provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS ?? "");
    ctx = new Context({ provider, etherscan: process.env.ETHERSCAN_KEY });
  });

  it("calculate apy (network)", async () => {
    const apy = await calculateApy(CurveVault, ctx);
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
