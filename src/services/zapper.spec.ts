import { getAddress } from "@ethersproject/address";

import { ChainId, Context, ZapperService } from "..";
import { Chains } from "../chain";
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

  ([1, 1337, 250, 42161] as ChainId[]).forEach(chainId =>
    it(`should not throw when chainId is ${chainId}`, () => {
      expect(() => {
        zapperServiceService = new ZapperService(chainId, new Context({}));
      }).not.toThrow();
    })
  );

  describe("supportedTokens", () => {
    ([1, 1337] as ChainId[]).forEach(chainId =>
      describe(`when chainId is ${chainId}`, () => {
        beforeEach(() => {
          zapperServiceService = new ZapperService(chainId, new Context({}));
        });

        it("should return the only visible tokens", async () => {
          const mockZapperToken = createMockZapperToken();
          const mockHiddenZapperToken = createMockZapperToken({
            symbol: "SHY",
            hide: true
          });

          fetchSpy.mockImplementation(
            jest.fn(() =>
              Promise.resolve({
                json: () => Promise.resolve([mockZapperToken, mockHiddenZapperToken]),
                status: 200
              })
            ) as jest.Mock
          );
          getAddressMock.mockReturnValue("0x001");

          const actualSupportedTokens = await zapperServiceService.supportedTokens();

          expect(actualSupportedTokens.length).toEqual(1);
          expect(actualSupportedTokens).toEqual(
            expect.arrayContaining([
              {
                address: "0x001",
                decimals: "18",
                icon: `https://assets.yearn.network/tokens/${Chains[chainId]}/${mockZapperToken.address}.png`,
                name: "DEAD",
                priceUsdc: "10000",
                supported: { zapper: true },
                symbol: "DEAD"
              }
            ])
          );
          expect(getAddress).toHaveBeenCalledWith("0x001");
        });
      })
    );
  });
});
