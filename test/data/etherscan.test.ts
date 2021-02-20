import "dotenv/config";

import { Context } from "@data/context";
import { fetchTransactionList } from "@protocols/etherscan";

describe("etherscan integration", () => {
  let ctx: Context;

  beforeAll(() => {
    ctx = new Context({ etherscan: process.env.ETHERSCAN_KEY });
  });

  it("should fetch tx list (network)", () => {
    const address = "0x0000000000000000000000000000000000000000";
    const request = fetchTransactionList({ address, offset: 1 }, ctx);
    return expect(request).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          timeStamp: expect.any(Number),
          blockNumber: expect.any(Number)
        })
      ])
    );
  }, 20000);
});
