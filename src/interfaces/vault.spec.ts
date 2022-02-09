import { ChainId, Context, VaultInterface, Yearn } from "..";
import { createMockEarningsUserData } from "../factories/earningsUserData.factory";

const earningsAccountAssetsDataMock = jest.fn();

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      meta: {},
      lens: {},
      vision: {},
      asset: {},
      helper: {},
      oracle: {},
      zapper: {}
    },
    strategies: {},
    earnings: {
      accountAssetsData: earningsAccountAssetsDataMock
    },
    tokens: {}
  }))
}));

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      write: {
        getSigner: jest.fn().mockImplementation(() => ({
          sendTransaction: jest.fn().mockResolvedValue("transaction")
        }))
      }
    }
  }))
}));

describe("VaultInterface", () => {
  let vaultInterface: VaultInterface<1>;

  let mockedYearn: Yearn<ChainId>;

  beforeEach(() => {
    mockedYearn = new (Yearn as jest.Mock<Yearn<ChainId>>)();
    vaultInterface = new VaultInterface(mockedYearn, 1, new Context({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    it.todo("should get all yearn vaults");
  });

  describe("getStatic", () => {
    it.todo("should get static part of yearn vaults");
  });

  describe("getDynamic", () => {
    it.todo("should get dynamic part of yearn vaults");
  });

  describe("positionsOf", () => {
    it.todo("should get yearn vault positions for a particular address");
  });

  describe("summaryOf", () => {
    it("should get the Vaults User Summary for a particular address", async () => {
      const earningsUserData = createMockEarningsUserData();
      earningsAccountAssetsDataMock.mockResolvedValueOnce(earningsUserData);

      const actualSummaryOf = await vaultInterface.summaryOf("0x000");

      expect(actualSummaryOf).toEqual({ earnings: "1", estimatedYearlyYield: "1", grossApy: 1, holdings: "1" });
      expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
      expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x000");
    });
  });

  describe("metadataOf", () => {
    beforeEach(() => {
      const earningsUserData = createMockEarningsUserData();
      earningsAccountAssetsDataMock.mockResolvedValueOnce(earningsUserData);
    });

    describe("when an addresses array is not given", () => {
      it("should get the Vault User Metadata for a particular address", async () => {
        const actualMetadataOf = await vaultInterface.metadataOf("0x001");

        expect(actualMetadataOf).toEqual([{ assetAddress: "0x001", earned: "1" }]);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
      });
    });

    describe("when an addresses array is given", () => {
      describe("when the address provided is included in the addresses array", () => {
        it("should get the Vault User Metadata for the address provided", async () => {
          const actualMetadataOf = await vaultInterface.metadataOf("0x001", ["0x000", "0x001", "0x002"]);

          expect(actualMetadataOf).toEqual([{ assetAddress: "0x001", earned: "1" }]);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
        });
      });

      describe("when the address provided is not included in the addresses array", () => {
        it("should return an empty array", async () => {
          const actualMetadataOf = await vaultInterface.metadataOf("0x001", ["0x000", "0x002"]);

          expect(actualMetadataOf).toEqual([]);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
        });
      });

      describe("when the addresses array is empty", () => {
        it("should return an empty array", async () => {
          const actualMetadataOf = await vaultInterface.metadataOf("0x001", []);

          expect(actualMetadataOf).toEqual([]);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
        });
      });
    });
  });

  describe("balances", () => {
    it.todo("should get all yearn vault's underlying token balances for a particular address");
  });

  describe("tokens", () => {
    it.todo("should get all yearn vault's underlying tokens");
  });

  describe("deposit", () => {
    it.todo("should deposit into a yearn vault");
  });

  describe("withdraw", () => {
    it.todo("should withdraw from a yearn vault");
  });
});
