import { ApyMap, ChainId, FeesInterface, Usdc, VaultStatic } from "..";
import { Context } from "../context";
import { toBN } from "../utils";
import { Yearn } from "../yearn";

const subgraphFetchQueryMock = jest.fn();
const visionApyMock: jest.Mock<Promise<ApyMap<string>>> = jest.fn();
const lensAdaptersVaultsV2AssetsStaticMock: jest.Mock<Promise<VaultStatic[]>> = jest.fn();
const oracleGetPriceUsdcMock: jest.Mock<Promise<Usdc>> = jest.fn();
const getBlockNumberMock: jest.Mock<Promise<number>> = jest.fn();

const dateMock = new Date("2022-01-01");
jest.spyOn(global, "Date").mockImplementation(() => dateMock as unknown as string);

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

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      read: {
        getBlockNumber: getBlockNumberMock,
      },
    },
  })),
}));

describe("FeesInterface", () => {
  let feesInterface: FeesInterface<1>;
  let mockedYearn: Yearn<ChainId>;

  beforeEach(() => {
    mockedYearn = new (Yearn as jest.Mock<Yearn<ChainId>>)();
    feesInterface = new FeesInterface(mockedYearn, 1, new Context({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("protocolFees", () => {
    describe("when there is no data", () => {
      beforeEach(() => {
        subgraphFetchQueryMock.mockResolvedValue(undefined);
      });

      it("should return a string representing the value of BigNumber(0)", async () => {
        const actualProtocolFees = await feesInterface.protocolFees(new Date());

        expect(actualProtocolFees).toEqual("0");
      });
    });

    describe("when there is data", () => {
      beforeEach(() => {
        subgraphFetchQueryMock.mockResolvedValue({
          data: {
            transfers: [
              {
                tokenAmountUsdc: toBN(3).toString(),
              },
              {
                tokenAmountUsdc: toBN(4).toString(),
              },
            ],
          },
        });
      });

      it("should return the protocol fees", async () => {
        const actualProtocolFees = await feesInterface.protocolFees(new Date());

        expect(actualProtocolFees).toEqual(toBN(7).toFixed(0));
      });
    });
  });
});
