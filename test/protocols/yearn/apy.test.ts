import "dotenv/config";

import { Context } from "@data/context";
import { WebSocketProvider } from "@ethersproject/providers";
import { calculateYearlyRoi } from "@protocols/common/apy";
import { calculate } from "@protocols/yearn/vault/apy";
import { BigNumber } from "@utils/bignumber";

import { vaults } from "./testdata";

describe("yearn yearly roi", () => {
  it("should calculate yearly roi", () => {
    expect(
      calculateYearlyRoi(
        { block: 366, value: new BigNumber(100) },
        { block: 1, value: new BigNumber(50) },
        1
      )
    ).toBe(1);
    expect(
      calculateYearlyRoi(
        { block: 366, value: new BigNumber(0) },
        { block: 1, value: new BigNumber(50) },
        1
      )
    ).toBe(-1);
    expect(
      calculateYearlyRoi(
        { block: 366, value: new BigNumber(50) },
        { block: 1, value: new BigNumber(50) },
        1
      )
    ).toBe(0);
    expect(
      calculateYearlyRoi(
        { block: 366, value: new BigNumber(75) },
        { block: 1, value: new BigNumber(50) },
        1
      )
    ).toBe(0.5);
    expect(
      calculateYearlyRoi(
        { block: 366, value: new BigNumber(25) },
        { block: 1, value: new BigNumber(50) },
        1
      )
    ).toBe(-0.5);
  });
});

describe("vault apy", () => {
  let provider: WebSocketProvider;
  let ctx: Context;

  beforeAll(() => {
    provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS ?? "");
    ctx = new Context({ provider, etherscan: process.env.ETHERSCAN_KEY });
  });

  it("calculate apy v1 (network)", () => {
    const inception = calculate(vaults.v1.object, ctx);
    return expect(inception).resolves.toEqual({
      composite: expect.any(Boolean),
      data: {
        baseApy: expect.any(Number),
        boostedApy: expect.any(Number),
        currentBoost: expect.any(Number),
        poolApy: expect.any(Number),
        totalApy: expect.any(Number)
      },
      description: expect.any(String),
      recommended: expect.any(Number),
      type: expect.any(String)
    });
  }, 15000);

  it("calculate apy v2 (network)", () => {
    const inception = calculate(vaults.v2.object, ctx);
    return expect(inception).resolves.toEqual({
      composite: expect.any(Boolean),
      data: {
        inceptionSample: expect.any(Number),
        oneMonthSample: expect.any(Number)
      },
      description: expect.any(String),
      recommended: expect.any(Number),
      type: expect.any(String)
    });
  }, 15000);

  afterAll(() => {
    return provider.destroy();
  });
});
