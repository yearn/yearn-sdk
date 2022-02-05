import { ChainId, TokenInterface } from "..";
import { Context } from "../context";
import { Yearn } from "../yearn";

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      oracle: {
        getPriceFromRouter: jest.fn(),
        getPriceUsdc: jest.fn()
      }
    }
  }))
}));

describe("TokenInterface", () => {
  let tokenInterface: TokenInterface<1>;

  let mockedYearn: Yearn<ChainId>;
  const MockedYearnClass = Yearn as jest.Mock<Yearn<ChainId>>;

  beforeEach(() => {
    mockedYearn = new MockedYearnClass();
    tokenInterface = new TokenInterface(mockedYearn, 1, new Context({ disableAllowlist: true }));
  });

  describe("price", () => {
    it("should should get the exchange rate between two tokens", async () => {
      (mockedYearn.services.oracle.getPriceFromRouter as jest.Mock).mockResolvedValue(1);

      expect(await tokenInterface.price("0x000", "0x001")).toEqual(1);
      expect(mockedYearn.services.oracle.getPriceFromRouter).toHaveBeenCalledTimes(1);
      expect(mockedYearn.services.oracle.getPriceFromRouter).toHaveBeenCalledWith("0x000", "0x001");
    });
  });

  describe("priceUsdc", () => {
    let mockGetPriceUsdc: jest.Mock;

    beforeEach(() => {
      mockGetPriceUsdc = mockedYearn.services.oracle.getPriceUsdc as jest.Mock;
    });

    it("should get the suggested Usdc exchange rate for a token", async () => {
      mockGetPriceUsdc.mockResolvedValue(0.000001);

      expect(await tokenInterface.priceUsdc("0x000")).toEqual(0.000001);
      expect(mockGetPriceUsdc).toHaveBeenCalledTimes(1);
      expect(mockGetPriceUsdc).toHaveBeenCalledWith("0x000", undefined);
    });

    it("should get the suggested Usdc exchange rate for list of tokens", async () => {
      mockGetPriceUsdc.mockResolvedValueOnce([0.000001, 0.000002]).mockResolvedValueOnce([0.000003, 0.000004]);

      expect(await tokenInterface.priceUsdc(["0x000", "0x001"])).toEqual({
        "0x000": [0.000001, 0.000002],
        "0x001": [0.000003, 0.000004]
      });
      expect(mockGetPriceUsdc).toHaveBeenCalledTimes(2);
      expect(mockGetPriceUsdc).toHaveBeenNthCalledWith(1, "0x000", undefined);
      expect(mockGetPriceUsdc).toHaveBeenNthCalledWith(2, "0x001", undefined);
    });
  });

  describe("balances", () => {
    it.todo("should fetch token balances from the TokenInterface.supported list");
  });

  describe("supported", () => {
    it.todo("should fetch all the tokens supported by the zapper protocol along with some basic metadata");
  });

  describe("approve", () => {
    it.todo("should approve vault to spend a token on zapIn");
  });

  describe("approveZapOut", () => {
    it.todo("should approve vault to spend a vault token on zapOut");
  });

  describe("icon", () => {
    it.todo("should get an icon url for a particular address");

    it.todo("should get a map of icons for a list of addresses");
  });

  describe("metadata", () => {
    it.todo("should");
  });
});
