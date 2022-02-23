import { getAddress } from "@ethersproject/address";
import BigNumber from "bignumber.js";

import { Address, AssetHistoricEarnings, ChainId, EarningsInterface, SdkError, Usdc, VaultStatic } from "..";
import { Context } from "../context";
import { createMockAssetHistoricEarnings, createMockAssetStaticVaultV2 } from "../test-utils/factories";
import { Yearn } from "../yearn";

const getAddressMock = jest.fn();
const subgraphFetchQueryMock = jest.fn();
const oracleGetPriceUsdcMock: jest.Mock<Promise<Usdc>> = jest.fn();
const lensAdaptersVaultsV2AssetsStaticMock: jest.Mock<Promise<VaultStatic[]>> = jest.fn();
const getBlockNumberMock: jest.Mock<Promise<number>> = jest.fn();

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      subgraph: {
        fetchQuery: subgraphFetchQueryMock
      },
      vision: {},
      lens: {
        adapters: { vaults: { v2: { assetsStatic: lensAdaptersVaultsV2AssetsStaticMock } } }
      },
      oracle: {
        getPriceUsdc: oracleGetPriceUsdcMock
      }
    }
  }))
}));

jest.mock("@ethersproject/address", () => ({
  getAddress: jest.fn().mockImplementation(() => getAddressMock)
}));

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      read: {
        getBlockNumber: getBlockNumberMock
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
        const actualAssetEarnings = await earningsInterface.assetEarnings(assetAddress);

        expect(actualAssetEarnings).toEqual({
          amount: "2000000000000000000",
          amountUsdc: "7",
          assetAddress: getAddressMock,
          tokenAddress: getAddressMock
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
    it.todo("todo");
  });

  describe("assetsHistoricEarnings", () => {
    const assetHistoricEarnings = createMockAssetHistoricEarnings();
    let assetHistoricEarningsCacheFetchMock: jest.Mock<Promise<AssetHistoricEarnings[] | undefined>> = jest.fn();

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
      let assetHistoricEarningsMock: jest.Mock<Promise<AssetHistoricEarnings>> = jest.fn();
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

  describe("assetHistoricEarnings", () => {});

  describe("accountHistoricEarnings", () => {});
});
