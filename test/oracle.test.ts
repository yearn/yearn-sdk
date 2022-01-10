import { JsonRpcProvider } from "@ethersproject/providers";
import { BigNumber } from "bignumber.js";

import { Yearn } from "../src";
import { Integer, Usdc } from "../src/types";

describe("oracle", () => {
  beforeAll(async () => {
    const chainId = 1;
    const rpcUrl = "https://mainnet.infura.io/v3/45d81b2f73574dfd8219e41106d0f821";
    const oracleAddress = "0x83d95e0D5f402511dB06817Aff3f9eA88224B030";
    this.yearn = new Yearn(chainId, {
      provider: new JsonRpcProvider(rpcUrl),
      addresses: {
        oracle: oracleAddress
      }
    });
    this.yfiAddress = "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e";
  });
  test("getNormalizedValueUsdc single call", async function() {
    const amount: Integer = new BigNumber("1e18").toString();
    const normValue: Usdc = await this.yearn.services.oracle.getNormalizedValueUsdc(this.yfiAddress, amount);
    expect(+normValue).toBeGreaterThan(0);
  });
  test("getNormalizedValueUsdc multi call", async function() {
    const amount: Integer = new BigNumber("1e18").toString();
    const normValues: Usdc[] = await this.yearn.services.oracle.getNormalizedValuesUsdc(
      [this.yfiAddress, this.yfiAddress],
      [amount, amount]
    );
    expect(+normValues[0]).toBeGreaterThan(0);
    expect(+normValues[1]).toBeGreaterThan(0);
  });
});
