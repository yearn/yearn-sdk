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
    it.todo("should get the Vault User Metadata for a particular address");
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
