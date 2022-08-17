import { getLocalizedString } from "./localization";

describe("Localization", () => {
  describe("getLocalizedString", () => {
    it("should throw TypeError when localization is `undefined`", () => {
      expect(() =>
        getLocalizedString({
          obj: {
            localization: undefined as unknown as string,
          },
          locale: "en",
          fallback: "foobar",
        })
      ).toThrowError(new TypeError("Cannot read properties of undefined (reading 'en')"));
    });
  });
});
