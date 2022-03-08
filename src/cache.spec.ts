import { CachedFetcher } from "./cache";
import { Context } from "./context";

const contextCacheSpy = jest.spyOn(Context.prototype, "cache", "get");
const currentValueSpy = jest.spyOn(CachedFetcher.prototype, "currentValue", "get");

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
        currentValueSpy.mockReturnValue({ cachedValue: true });

        const actualFetch = await cachedFetcher.fetch();

        expect(actualFetch).toEqual({ cachedValue: true });
      });
    });
  });
});
