import { JsonRpcProvider } from "@ethersproject/providers";
import { BigNumber } from "bignumber.js";

import { Yearn } from "../src";
import { ChainId } from "../src/chain";
import { Integer, Usdc } from "../src/types";

describe("oracle", () => {
  let yearn: Yearn<ChainId>;
  let tokenAddress: string;
  beforeAll(async () => {
    const chainId = 1;
    const rpcUrl = "https://mainnet.infura.io/v3/45d81b2f73574dfd8219e41106d0f821";
    const oracleAddress = "0x83d95e0D5f402511dB06817Aff3f9eA88224B030";
    yearn = new Yearn(chainId, {
      provider: new JsonRpcProvider(rpcUrl),
      addresses: {
        oracle: oracleAddress
      }
    });
    tokenAddress = "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e"; // yfi
  });
  test("getNormalizedValueUsdc single call", async function() {
    const amount: Integer = new BigNumber("1e18").toString();
    const normValue: Usdc = await yearn.services.oracle.getNormalizedValueUsdc(tokenAddress, amount);
    expect(+normValue).toBeGreaterThan(0);
  });
  test("getNormalizedValueUsdc multi call", async function() {
    const amount: Integer = new BigNumber("1e18").toString();
    const normValues: Usdc[] = await yearn.services.oracle.getNormalizedValuesUsdc(
      [tokenAddress, tokenAddress],
      [amount, amount]
    );
    expect(+normValues[0]).toBeGreaterThan(0);
    expect(+normValues[1]).toBeGreaterThan(0);
  });
});
