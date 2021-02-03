import { fetchAliases, fetchAssets } from "../../src/data/assets";

describe("assets", () => {
  it("fetch aliases (network)", async () => {
    const aliases = await fetchAliases();
    return expect(Object.values(aliases)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          symbol: expect.any(String),
          address: expect.any(String)
        })
      ])
    );
  });
  it("fetch assets (network)", async () => {
    const assets = await fetchAssets();
    return expect(Object.values(assets)).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
  });
});
