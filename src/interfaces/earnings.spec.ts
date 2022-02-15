import { getAddress } from "@ethersproject/address";
import BigNumber from "bignumber.js";

import { ChainId, EarningsInterface, SdkError, Usdc } from "..";
import { Context } from "../context";
import { Yearn } from "../yearn";

const getAddressMock = jest.fn();
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

jest.mock("@ethersproject/address", () => ({
  getAddress: jest.fn().mockImplementation(() => getAddressMock)
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

  describe("assetEarnings", () => {
    describe("when there is no data", () => {
      beforeEach(() => {
        subgraphFetchQueryMock.mockResolvedValue(undefined);
      });

      it("should throw", async () => {
        try {
          await earningsInterface.assetEarnings("0x001");
        } catch (error) {
          expect(error).toStrictEqual(new SdkError("No asset with address 0x001"));
        }
      });
    });

    describe("when there is data", () => {
      beforeEach(() => {
        getAddressMock.mockReturnValue("0x001");
        oracleGetPriceUsdcMock.mockResolvedValueOnce("3.5");
        subgraphFetchQueryMock.mockResolvedValue({
          data: {
            vault: {
              token: {
                id: "vaultTokenId",
                decimals: 18
              },
              latestUpdate: {
                returnsGenerated: new BigNumber(2).multipliedBy(10 ** 18)
              }
            }
          }
        });
      });

      it("should return the asset earnings", async () => {
        const actualAssetEarnings = await earningsInterface.assetEarnings("0x001");

        expect(actualAssetEarnings).toEqual({
          amount: "2000000000000000000",
          amountUsdc: "7",
          assetAddress: getAddressMock,
          tokenAddress: getAddressMock
        });
        expect(oracleGetPriceUsdcMock).toHaveBeenCalledTimes(1);
        expect(oracleGetPriceUsdcMock).toHaveBeenCalledWith("vaultTokenId");

        expect(getAddress).toHaveBeenCalledTimes(2);
        expect(getAddress).toHaveBeenNthCalledWith(1, "0x001");
        expect(getAddress).toHaveBeenNthCalledWith(2, "vaultTokenId");
      });
    });
  });

  describe("accountAssetsData", () => {});

  describe("assetsHistoricEarnings", () => {});

  describe("assetHistoricEarnings", () => {});

  describe("accountHistoricEarnings", () => {});
});
