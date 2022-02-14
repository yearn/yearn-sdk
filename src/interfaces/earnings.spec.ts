import { ChainId, EarningsInterface } from "..";
import { Context } from "../context";
import { Yearn } from "../yearn";

const subgraphFetchQueryMock = jest.fn();

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      subgraph: {
        fetchQuery: subgraphFetchQueryMock
      },
      vision: {},
      lens: {},
      oracle: {}
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
    describe("when there is no response", () => {
      beforeEach(() => {
        subgraphFetchQueryMock.mockResolvedValue(undefined);
      });

      it("should return a string representing the value of BigNumber(0)", async () => {
        const actualProtocolEarnings = await earningsInterface.protocolEarnings();

        expect(actualProtocolEarnings).toEqual("0");
      });
    });
  });

  describe("assetEarnings", () => {});

  describe("accountAssetsData", () => {});

  describe("assetsHistoricEarnings", () => {});

  describe("assetHistoricEarnings", () => {});

  describe("accountHistoricEarnings", () => {});
});
