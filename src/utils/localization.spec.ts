import { getLocalizedString } from "./localization";

describe("Localization", () => {
  describe("getLocalizedString", () => {
    it("should not throw TypeError when localization is `undefined`", () => {
      let actual;
      expect(
        () =>
          (actual = getLocalizedString({
            obj: {
              localization: undefined as unknown as string,
            },
            locale: "en",
            fallback: "foobar",
          }))
      ).not.toThrowError(new TypeError("Cannot read properties of undefined (reading 'en')"));
      expect(actual).toEqual("foobar");
    });
  });
});
