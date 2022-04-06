import { getAddress } from "@ethersproject/address";

import { ChainId, Context, ZapperService } from "..";
import { Chains } from "../chain";
import { createMockTokenMarketData, createMockZapperToken } from "../test-utils/factories";

const fetchSpy = jest.spyOn(global, "fetch");

const getAddressMock = jest.fn();

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    zapper: "ZAPPER_API_KEY",
  })),
}));

jest.mock("@ethersproject/address", () => ({
  getAddress: jest.fn(() => getAddressMock()),
}));

describe("ZapperService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let zapperServiceService: ZapperService;

  ([1, 1337, 250, 42161] as ChainId[]).forEach((chainId) =>
    it(`should not throw when chainId is ${chainId}`, () => {
      expect(() => {
        zapperServiceService = new ZapperService(chainId, new Context({}));
      }).not.toThrow();
    })
  );

  describe("supportedTokens", () => {
    ([1, 1337] as ChainId[]).forEach((chainId) =>
      describe(`when chainId is ${chainId}`, () => {
        beforeEach(() => {
          zapperServiceService = new ZapperService(chainId, new Context({}));
        });

        it("should return the only visible tokens", async () => {
          const mockZapperToken = createMockZapperToken();
          const mockHiddenZapperToken = createMockZapperToken({
            symbol: "SHY",
            hide: true,
          });

          fetchSpy.mockImplementation(
            jest.fn(() =>
              Promise.resolve({
                json: () => Promise.resolve([mockZapperToken, mockHiddenZapperToken]),
                status: 200,
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
                dataSource: "zapper",
                supported: { zapper: true },
                symbol: "DEAD",
              },
            ])
          );
          expect(getAddress).toHaveBeenCalledWith("0x001");
        });
      })
    );
  });

  describe("tokenMarketData", () => {
    ([1, 1337] as ChainId[]).forEach((chainId) =>
      describe(`when chainId is ${chainId}`, () => {
        beforeEach(() => {
          zapperServiceService = new ZapperService(chainId, new Context({}));
        });

        it("should return the vault token market data", async () => {
          const mockTokenMarketData = createMockTokenMarketData();

          fetchSpy.mockImplementation(
            jest.fn(() =>
              Promise.resolve({
                json: () => Promise.resolve([mockTokenMarketData]),
                status: 200,
              })
            ) as jest.Mock
          );

          const actual = await zapperServiceService.tokenMarketData();

          expect(fetchSpy).toHaveBeenCalledTimes(1);
          expect(fetchSpy).toHaveBeenCalledWith(
            "https://api.zapper.fi/v1/protocols/yearn/token-market-data?network=ethereum&type=vault&api_key=ZAPPER_API_KEY"
          );
          expect(actual).toEqual([mockTokenMarketData]);
        });
      })
    );

    ([250, 42161] as ChainId[]).forEach((chainId) => {
      it(`should throw when chainId is ${chainId}`, () => {
        zapperServiceService = new ZapperService(chainId, new Context({}));

        expect(async () => {
          await zapperServiceService.tokenMarketData();
        }).rejects.toThrow(`Only Ethereum is supported for token market data, got ${chainId}`);
      });
    });
  });
});
