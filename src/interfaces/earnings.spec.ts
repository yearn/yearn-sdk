import BigNumber from "bignumber.js";

import { ChainId, EarningsInterface, Usdc } from "..";
import { Context } from "../context";
import { Yearn } from "../yearn";

const subgraphFetchQueryMock = jest.fn();
const oracleGetPriceUsdcMock: jest.Mock<Promise<Usdc>> = jest.fn();

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      subgraph: {
        fetchQuery: subgraphFetchQueryMock
      },
      vision: {},
      lens: {},
      oracle: {
        getPriceUsdc: oracleGetPriceUsdcMock
      }
    }
  }))
}));

describe("EarningsInterface", () => {
  let earningsInterface: EarningsInterface<1>;

  let mockedYearn: Yearn<ChainId>;

  beforeEach(() => {
    mockedYearn = new (Yearn as jest.Mock<Yearn<ChainId>>)();
    earningsInterface = new EarningsInterface(mockedYearn, 1, new Context({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("protocolEarnings", () => {
    describe("when there is no data", () => {
      beforeEach(() => {
        subgraphFetchQueryMock.mockResolvedValue(undefined);
      });

      it("should return a string representing the value of BigNumber(0)", async () => {
        const actualProtocolEarnings = await earningsInterface.protocolEarnings();

        expect(actualProtocolEarnings).toEqual("0");
      });
    });

    describe("when there is data", () => {
      beforeEach(() => {
        oracleGetPriceUsdcMock.mockResolvedValueOnce("2.5");
        subgraphFetchQueryMock.mockResolvedValue({
          data: {
            vaults: [
              {
                latestUpdate: {
                  returnsGenerated: new BigNumber(2).multipliedBy(10 ** 18)
                },
                token: {
                  decimals: 18,
                  id: "tokenId"
                }
              },
              {
                token: {
                  decimals: 18,
                  id: "tokenIdWithoutLatestUpdate"
                }
              }
            ]
          }
        });
      });

      it("should return the protocol earnings", async () => {
        const actualProtocolEarnings = await earningsInterface.protocolEarnings();

        expect(actualProtocolEarnings).toEqual(new BigNumber(5).toFixed(0));
      });
    });
  });

  describe("assetEarnings", () => {});

  describe("accountAssetsData", () => {});

  describe("assetsHistoricEarnings", () => {});

  describe("assetHistoricEarnings", () => {});

  describe("accountHistoricEarnings", () => {});
});
