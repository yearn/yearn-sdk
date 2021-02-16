import "dotenv/config";

import { WebSocketProvider } from "@ethersproject/providers";

// import { Context } from "../../../../../data/context";
import { BigNumber } from "../../../../../utils/bn";
// import { calculateApy } from "../";
import { calculateYearlyRoi } from "../apy";
// import { vaults } from "./testdata";

describe("yearly roi", () => {
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
  // let ctx: Context;

  beforeAll(() => {
    provider = new WebSocketProvider(process.env.WEB3_PROVIDER_WSS ?? "");
    // ctx = new Context({ provider, etherscan: process.env.ETHERSCAN_KEY });
  });

  // it("calculate apy v1 (network)", () => {
  //   const inception = calculateApy(vaults.v1.object, ctx);
  //   return expect(inception).resolves.toEqual({
  //     inceptionSample: expect.any(Number),
  //     oneMonthSample: expect.any(Number)
  //   });
  // }, 15000);

  // it("calculate apy v2 (network)", () => {
  //   const inception = calculateApy(vaults.v2.object, ctx);
  //   return expect(inception).resolves.toEqual({
  //     inceptionSample: expect.any(Number),
  //     oneMonthSample: expect.any(Number)
  //   });
  // }, 15000);

  afterAll(() => {
    return provider.destroy();
  });
});
