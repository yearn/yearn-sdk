import { getAddress } from "@ethersproject/address";

import { ChainId, Context, ZapperService } from "..";
import { Chains } from "../chain";
import { createMockZapperToken } from "../test-utils/factories";
import { ZapperToken } from "../types";

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
    ([1, 250, 1337] as ChainId[]).forEach(chainId =>
      describe(`when chainId is ${chainId}`, () => {
        beforeEach(() => {
          zapperServiceService = new ZapperService(chainId, new Context({}));
        });

        it("should return the supported tokens", async () => {
          const mockZapperToken = createMockZapperToken();
          const mockUnsupportedZapperToken = createMockZapperToken({
            symbol: "SHY",
            hide: undefined
          });
          const mockIncompleteZapperToken = createMockZapperToken({
            price: undefined
          } as Partial<ZapperToken>);

          fetchSpy.mockImplementation(
            jest.fn(() =>
              Promise.resolve({
                json: () => Promise.resolve([mockZapperToken, mockUnsupportedZapperToken, mockIncompleteZapperToken]),
                status: 200
              })
            ) as jest.Mock
          );
          getAddressMock.mockReturnValue("0x001");

          const actualSupportedTokens = await zapperServiceService.supportedTokens();

          expect(actualSupportedTokens.length).toEqual(2);
          expect(actualSupportedTokens).toEqual(
            expect.arrayContaining([
              {
                address: "0x001",
                decimals: "18",
                icon: `https://assets.yearn.network/tokens/${Chains[chainId]}/${mockZapperToken.address}.png`,
                name: "DEAD",
                priceUsdc: "10000000",
                supported: { zapper: false },
                symbol: "DEAD"
              },
              {
                address: "0x001",
                decimals: "18",
                icon: `https://assets.yearn.network/tokens/${Chains[chainId]}/${mockZapperToken.address}.png`,
                name: "SHY",
                priceUsdc: "10000000",
                supported: { zapper: true },
                symbol: "SHY"
              }
            ])
          );
          expect(getAddress).toHaveBeenCalledWith("0x001");
        });
      })
    );
  });
});
