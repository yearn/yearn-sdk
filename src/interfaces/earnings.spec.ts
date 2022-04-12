/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAddress } from "@ethersproject/address";
import BigNumber from "bignumber.js";

import { Address, ApyMap, AssetHistoricEarnings, ChainId, EarningsInterface, SdkError, Usdc, VaultStatic } from "..";
import { Context } from "../context";
import { createMockAssetHistoricEarnings, createMockAssetStaticVaultV2 } from "../test-utils/factories";
import { createMockAccountEarningsResponse } from "../test-utils/factories/accountEarningsResponse.factory";
import { createMockApy } from "../test-utils/factories/apy.factory";
import { Yearn } from "../yearn";

const getAddressMock = jest.fn();
const subgraphFetchQueryMock = jest.fn();
const visionApyMock: jest.Mock<Promise<ApyMap<string>>> = jest.fn();
const oracleGetPriceUsdcMock: jest.Mock<Promise<Usdc>> = jest.fn();
const lensAdaptersVaultsV2AssetsStaticMock: jest.Mock<Promise<VaultStatic[]>> = jest.fn();
const getBlockNumberMock: jest.Mock<Promise<number>> = jest.fn();

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      subgraph: {
        fetchQuery: subgraphFetchQueryMock,
      },
      vision: {
        apy: visionApyMock,
      },
      lens: {
        adapters: { vaults: { v2: { assetsStatic: lensAdaptersVaultsV2AssetsStaticMock } } },
      },
      oracle: {
        getPriceUsdc: oracleGetPriceUsdcMock,
      },
    },
  })),
}));

jest.mock("@ethersproject/address", () => ({
  getAddress: jest.fn(() => getAddressMock()),
}));

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      read: {
        getBlockNumber: getBlockNumberMock,
      },
    },
  })),
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
                  returnsGenerated: new BigNumber(2).multipliedBy(10 ** 18),
                },
                token: {
                  decimals: 18,
                  id: "tokenId",
                },
              },
              {
                token: {
                  decimals: 18,
                  id: "tokenIdWithoutLatestUpdate",
                },
              },
            ],
          },
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
      const assetAddress: Address = "0x001";

      beforeEach(() => {
        getAddressMock.mockReturnValue("0x001");
        oracleGetPriceUsdcMock.mockResolvedValueOnce("3.5");
        subgraphFetchQueryMock.mockResolvedValue({
          data: {
            vault: {
              token: {
                id: "vaultTokenId",
                decimals: 18,
              },
              latestUpdate: {
                returnsGenerated: new BigNumber(2).multipliedBy(10 ** 18),
              },
            },
          },
        });
      });

      it("should return the asset earnings", async () => {
        const actualAssetEarnings = await earningsInterface.assetEarnings(assetAddress);

        expect(actualAssetEarnings).toEqual({
          amount: "2000000000000000000",
          amountUsdc: "7",
          assetAddress: "0x001",
          tokenAddress: "0x001",
        });
        expect(oracleGetPriceUsdcMock).toHaveBeenCalledTimes(1);
        expect(oracleGetPriceUsdcMock).toHaveBeenCalledWith("vaultTokenId");

        expect(getAddress).toHaveBeenCalledTimes(2);
        expect(getAddress).toHaveBeenNthCalledWith(1, assetAddress);
        expect(getAddress).toHaveBeenNthCalledWith(2, "vaultTokenId");
      });
    });
  });

  describe("accountAssetsData", () => {
    describe("when there is no account", () => {
      beforeEach(() => {
        subgraphFetchQueryMock.mockResolvedValue(undefined);
      });

      it("should return an empty EarningsUserData", async () => {
        const actual = await earningsInterface.accountAssetsData("0x001");

        expect(actual).toEqual({
          earnings: "0",
          holdings: "0",
          earningsAssetData: [],
          grossApy: 0,
          estimatedYearlyYield: "0",
        });
      });
    });

    describe("when there is an account", () => {
      const accountAddress: Address = "0x001";
      const apyMock = createMockApy({
        net_apy: 42,
      });
      const accountEarningsResponse = createMockAccountEarningsResponse();
      const tokensValueInUsdcMock: jest.Mock<Promise<BigNumber>> = jest.fn();

      beforeEach(() => {
        subgraphFetchQueryMock.mockResolvedValue(accountEarningsResponse);
        visionApyMock.mockResolvedValue({
          [accountAddress]: apyMock,
        });
        getAddressMock.mockReturnValue(accountAddress);
        (earningsInterface as any).tokensValueInUsdc = tokensValueInUsdcMock;
        tokensValueInUsdcMock.mockResolvedValue(new BigNumber(10));
      });

      it("should return an empty EarningsUserData", async () => {
        const actual = await earningsInterface.accountAssetsData(accountAddress);

        expect(visionApyMock).toHaveBeenCalledTimes(1);
        expect(visionApyMock).toHaveBeenCalledWith([accountAddress]);
        expect(getAddressMock).toHaveBeenCalledTimes(1);
        expect(actual).toEqual({
          earnings: "10",
          earningsAssetData: [
            {
              assetAddress: accountAddress,
              earned: "10",
            },
          ],
          estimatedYearlyYield: "420",
          grossApy: 42,
          holdings: "10",
        });
      });
    });
  });

  describe("assetsHistoricEarnings", () => {
    const assetHistoricEarnings = createMockAssetHistoricEarnings();
    const assetHistoricEarningsCacheFetchMock: jest.Mock<Promise<AssetHistoricEarnings[] | undefined>> = jest.fn();

    beforeEach(() => {
      (earningsInterface as any).assetHistoricEarningsCache.fetch = assetHistoricEarningsCacheFetchMock;
    });

    describe("when there is cached data", () => {
      beforeEach(() => {
        assetHistoricEarningsCacheFetchMock.mockResolvedValue([assetHistoricEarnings]);
      });

      it("return the cached data", async () => {
        const actualAssetsHistoricEarnings = await earningsInterface.assetsHistoricEarnings();

        expect(actualAssetsHistoricEarnings).toEqual([assetHistoricEarnings]);
        expect(assetHistoricEarningsCacheFetchMock).toHaveBeenCalledTimes(1);
      });
    });

    describe("when there is no cached data", () => {
      const assetHistoricEarningsMock: jest.Mock<Promise<AssetHistoricEarnings>> = jest.fn();
      const assetsStatic = [createMockAssetStaticVaultV2()];
      const assetHistoricEarnings = createMockAssetHistoricEarnings();

      beforeEach(() => {
        assetHistoricEarningsCacheFetchMock.mockResolvedValue(undefined);
        lensAdaptersVaultsV2AssetsStaticMock.mockResolvedValue(assetsStatic);
        getBlockNumberMock.mockResolvedValue(42000);
        (earningsInterface as any).assetHistoricEarnings = assetHistoricEarningsMock;
        assetHistoricEarningsMock.mockResolvedValue(assetHistoricEarnings);
      });

      it("should not call `assetHistoricEarningsCache.fetch`", async () => {
        const actualAssetsHistoricEarnings = await earningsInterface.assetsHistoricEarnings();

        expect(actualAssetsHistoricEarnings).toEqual([assetHistoricEarnings]);
        expect(lensAdaptersVaultsV2AssetsStaticMock).toHaveBeenCalledTimes(1);
        expect(getBlockNumberMock).toHaveBeenCalledTimes(1);
        expect(assetHistoricEarningsMock).toHaveBeenCalledTimes(1);
        expect(assetHistoricEarningsMock).toHaveBeenCalledWith("0x001", 30, 42000);
      });
    });
  });

  describe("assetHistoricEarnings", () => {
    beforeEach(() => {
      subgraphFetchQueryMock.mockResolvedValue({
        data: {
          block_30380: {
            strategies: [
              {
                latestReport: {
                  totalGain: "303000000000000000000",
                  totalLoss: "80000000000000000000",
                },
              },
            ],
            vaultDayData: [{ timestamp: "1648887421" }],
          },
          block_36140: {
            strategies: [
              {
                latestReport: {
                  totalGain: "361000000000000000000",
                  totalLoss: "40000000000000000000",
                },
              },
            ],
            vaultDayData: [{ timestamp: "1648801021" }],
          },
          block_41900: {
            strategies: [
              {
                latestReport: {
                  totalGain: "419000000000000000000",
                  totalLoss: "0",
                },
              },
            ],
            vaultDayData: [{ timestamp: "1648714621" }],
          },
          vault: {
            token: {
              id: "0xVaultTokenId",
              decimals: "18",
            },
          },
        },
      });
      oracleGetPriceUsdcMock.mockResolvedValue("6000000");
    });

    it("should return the asset historic earnings", async () => {
      const actual = await earningsInterface.assetHistoricEarnings("0x00", 3, 42000);

      expect(actual).toEqual({
        assetAddress: "0x00",
        dayData: [
          { date: "2022-04-02T08:17:01.000Z", earnings: { amount: "223000000000000000000", amountUsdc: "1338000000" } },
          { date: "2022-04-01T08:17:01.000Z", earnings: { amount: "321000000000000000000", amountUsdc: "1926000000" } },
          { date: "2022-03-31T08:17:01.000Z", earnings: { amount: "419000000000000000000", amountUsdc: "2514000000" } },
        ],
        decimals: "18",
      });
      expect(actual.dayData.length).toEqual(3);
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  describe.skip("accountHistoricEarnings", () => {});
});
