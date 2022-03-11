import { getAddress } from "@ethersproject/address";

import { Context, ZapperService } from "..";
import { createMockZapperToken } from "../test-utils/factories";

const fetchSpy = jest.spyOn(global, "fetch");

const getAddressMock = jest.fn();

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({}))
}));

jest.mock("@ethersproject/address", () => ({
  getAddress: jest.fn(() => getAddressMock())
}));

describe("ZapperService", () => {
  let zapperServiceService: ZapperService;

  describe("supportedTokens", () => {
    beforeEach(() => {
      zapperServiceService = new ZapperService(250, new Context({}));
    });

    it("should return the supported tokens", async () => {
      const mockZapperToken = createMockZapperToken();
      fetchSpy.mockImplementation(
        jest.fn(() => Promise.resolve({ json: () => Promise.resolve([mockZapperToken]), status: 200 })) as jest.Mock
      );
      getAddressMock.mockReturnValue("0x001");

      const actualSupportedTokens = await zapperServiceService.supportedTokens();

      expect(actualSupportedTokens).toEqual([
        {
          address: "0x001",
          decimals: "18",
          icon: "https://assets.yearn.network/tokens/fantom/0x001.png",
          name: "DEAD",
          priceUsdc: "10000000",
          supported: { zapper: false },
          symbol: "DEAD"
        }
      ]);
      expect(getAddress).toHaveBeenCalledWith("0x001");
    });
  });
});
