import { PartialDeep } from "type-fest";

import { CachedFetcher } from "./cache";
import { Context } from "./context";

const contextCacheSpy = jest.spyOn(Context.prototype, "cache", "get");
const currentValueSpy = jest.spyOn(CachedFetcher.prototype as any, "currentValue", "get");
const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
const fetchWithTimeoutSpy: jest.SpyInstance<Promise<PartialDeep<Response>>> = jest.spyOn(
  CachedFetcher.prototype as any,
  "fetchWithTimeout"
);
const nowMock = new Date(4242, 4, 2).getTime();
jest.spyOn(Date.prototype, "getTime").mockReturnValue(nowMock);

describe("CachedFetcher", () => {
  let cachedFetcher: CachedFetcher<unknown[]>;

  beforeEach(() => {
    cachedFetcher = new CachedFetcher("path", new Context({}), 1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetch", () => {
    it("should return undefined when `useCache` is set to `false`", async () => {
      contextCacheSpy.mockReturnValue({
        useCache: false,
        url: "url"
      });

      const actualFetch = await cachedFetcher.fetch();

      expect(actualFetch).toEqual(undefined);
    });

    it("should return undefined when `url` is not defined", async () => {
      contextCacheSpy.mockReturnValue({
        useCache: true
      });

      const actualFetch = await cachedFetcher.fetch();

      expect(actualFetch).toEqual(undefined);
    });

    describe("when useCache is `true` and there is a url", () => {
      beforeAll(() => {
        contextCacheSpy.mockReturnValue({
          useCache: true,
          url: "url"
        });
      });

      it("should return cached when there is a current value", async () => {
        currentValueSpy.mockReturnValueOnce({ cachedValue: true });

        const actualFetch = await cachedFetcher.fetch();

        expect(actualFetch).toEqual({ cachedValue: true });
      });

      it("should return the JSON", async () => {
        const responseMock: PartialDeep<Response> = {
          status: 200,
          headers: {
            get: _ => null
          },
          json: () =>
            Promise.resolve({
              foo: "bar"
            })
        };
        fetchWithTimeoutSpy.mockResolvedValueOnce(responseMock);

        const actualFetch = await cachedFetcher.fetch("fooParam");

        expect(fetchWithTimeoutSpy).toHaveBeenCalledWith("url/v1/chains/1/path?fooParam", 5000);
        expect(actualFetch).toEqual({
          foo: "bar"
        });

        expect(cachedFetcher.expiryDate).toEqual(new Date(nowMock + 30 * 1000));
        expect(cachedFetcher.cachedValue).toEqual({
          foo: "bar"
        });
      });

      it("should log warning when `fetchWithTimeout` fails", async () => {
        fetchWithTimeoutSpy.mockImplementation(() => {
          throw new Error("fetchWithTimeout failed!");
        });

        const actualFetch = await cachedFetcher.fetch("fooParam");

        expect(consoleWarnSpy).toHaveBeenCalledWith("Call to cache at url/v1/chains/1/path?fooParam timed out");
        expect(actualFetch).toEqual(undefined);
      });

      it("should log warning when `status` is not 200", async () => {
        const responseMock: PartialDeep<Response> = {
          status: 42,
          url: "url42",
          statusText: "ultimate question of life, the universe, and everything"
        };
        fetchWithTimeoutSpy.mockResolvedValueOnce(responseMock);

        const actualFetch = await cachedFetcher.fetch("fooParam");

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "Call to cache failed at url42 (status 42 ultimate question of life, the universe, and everything)"
        );
        expect(actualFetch).toEqual(undefined);
      });

      it("should return when there's no JSON", async () => {
        const responseMock: PartialDeep<Response> = {
          status: 200,
          json: () => Promise.resolve(null)
        };
        fetchWithTimeoutSpy.mockResolvedValueOnce(responseMock);

        const actualFetch = await cachedFetcher.fetch("fooParam");

        expect(actualFetch).toEqual(undefined);
      });
    });
  });
});
