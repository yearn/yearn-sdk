import { fetchAliases, fetchAssets } from "../../src/data/assets";

describe("assets", () => {
  it("fetch aliases", () => {
    const aliases = fetchAliases();
    return expect(aliases.then(Object.values)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          symbol: expect.any(String),
          address: expect.any(String)
        })
      ])
    );
  });
  it("fetch assets", () => {
    const aliases = fetchAssets();
    return expect(aliases.then(Object.values)).resolves.toEqual(
      expect.arrayContaining([expect.any(String)])
    );
  });
});
