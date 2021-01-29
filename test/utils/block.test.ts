import "dotenv/config";

import { WebSocketProvider } from "@ethersproject/providers";

import { Context } from "../../src/data/context";
import { estimateBlock, estimateBlockPrecise } from "../../src/utils/block";

const Timestamp = 1592179200;
const ActualBlock = 10267003;

describe("block estimation", () => {
  let provider: WebSocketProvider;
  let ctx: Context;

  beforeAll(() => {
    provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS ?? "");
    ctx = new Context({ provider, etherscan: process.env.ETHERSCAN_KEY });
  });

  it("loose estimation (network)", async () => {
    const currentBlock = await provider.getBlockNumber();
    const estimation = estimateBlock(Timestamp, currentBlock);
    expect(estimation).toStrictEqual(expect.any(Number));
  });

  it(
    "precise estimation (network)",
    async () => {
      const estimation = await estimateBlockPrecise(Timestamp, ctx);
      expect(estimation).toBeGreaterThanOrEqual(ActualBlock - 50);
      return expect(estimation).toBeLessThanOrEqual(ActualBlock + 50);
    },
    60 * 1000
  );

  afterAll(() => {
    return provider.destroy();
  });
});
