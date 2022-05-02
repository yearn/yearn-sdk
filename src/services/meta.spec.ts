/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from "../context";
import { createMockTokenMetadata, createMockVaultMetadata } from "../test-utils/factories";
import { MetaService } from "./meta";

describe("MetaService", () => {
  let meta: MetaService;

  beforeAll(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  beforeEach(() => {
    meta = new MetaService(1, new Context({}));
    jest.spyOn(console, "error").mockImplementation();
    const tokenMetadata1 = createMockTokenMetadata({ address: "0x001" });
    const tokenMetadata2 = createMockTokenMetadata({ address: "0x002" });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [tokenMetadata1, tokenMetadata2],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("tokens", () => {
    it("should fetch all tokens metadata when no addresses are given", async () => {
      await meta.tokens();

      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/tokens/1/all");
    });

    it("should fetch all tokens metadata from the addresses given", async () => {
      const tokenMetadata1 = createMockTokenMetadata({ address: "0x001" });
      const tokenMetadataIgnored = createMockTokenMetadata({ address: "0x002" });
      const tokenMetadata2 = createMockTokenMetadata({ address: "0x003" });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [tokenMetadata1, tokenMetadataIgnored, tokenMetadata2],
      });

      const actual = await meta.tokens(["0x001", "0x003"]);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/tokens/1/all");
      expect(actual).toEqual(expect.arrayContaining([tokenMetadata1, tokenMetadata2]));
      expect(actual).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            address: "0x002",
          }),
        ])
      );
    });

    it("should fetch all tokens metadata from the addresses given and replace localized strings", async () => {
      meta = new MetaService(1, new Context({ locale: 'es' }));

      const tokenMetadata1 = createMockTokenMetadata({ address: "0x001", localization: { es: { name: '', description: 'Spanish text' }, } });
      const tokenMetadataIgnored = createMockTokenMetadata({ address: "0x002" });
      const tokenMetadata2 = createMockTokenMetadata({ address: "0x003", localization: { es: { name: '', description: 'Spanish text' }, } });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [tokenMetadata1, tokenMetadataIgnored, tokenMetadata2],
      });

      const actual = await meta.tokens(["0x001", "0x003"]);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/tokens/1/all");
      expect(actual).toEqual(expect.arrayContaining([{
        ...tokenMetadata1,
        description: 'Spanish text',
      }, {
        ...tokenMetadata2,
        description: 'Spanish text',
      }]));
      expect(actual).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            address: "0x002",
          }),
        ])
      );
    });
  });

  describe("token", () => {
    it("should fetch a single token metadata from the address given", async () => {
      await meta.token("0x00");

      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/tokens/1/0x00");
    });

    it("should throw when it fails to fetch a single token metadata from the address given", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const actual = await meta.token("0x00");

      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/tokens/1/0x00");
      expect(actual).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        new Error(`Failed to fetch token with address "0x00". HTTP error: 404`)
      );
    });
  });

  describe("strategies", () => {
    it("should fetch the strategies metadata", async () => {
      await meta.token("0x00");

      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/tokens/1/0x00");
    });
  });

  describe("vaults", () => {
    it("should fetch all vaults metadata when no addresses are given", async () => {
      await meta.vaults();

      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/vaults/1/all");
    });

    it("should fetch all vaults metadata from the addresses given", async () => {
      const vaultMetadata1 = createMockVaultMetadata({ address: "0x001" });
      const vaultMetadata2 = createMockVaultMetadata({ address: "0x002" });
      const vaultMetadataIgnored = createMockVaultMetadata({ address: "0x003" });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [vaultMetadata1, vaultMetadataIgnored, vaultMetadata2],
      });

      const actual = await meta.vaults(["0x001", "0x002"]);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/vaults/1/all");
      expect(actual).toEqual(expect.arrayContaining([vaultMetadata1, vaultMetadata2]));
      expect(actual).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            address: "0x003",
          }),
        ])
      );
    });
  });

  describe("vault", () => {
    it("should fetch a single vault metadata from the address given", async () => {
      await meta.vault("0x00");

      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/vaults/1/0x00");
    });

    it("should throw when it fails to fetch a single vault metadata from the address given", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const actual = await meta.vault("0x00");

      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/vaults/1/0x00");
      expect(actual).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        new Error(`Failed to fetch token with address "0x00". HTTP error: 404`)
      );
    });
  });
});
