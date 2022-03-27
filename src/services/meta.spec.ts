import { Context } from "../context";
import { MetaService } from "./meta";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: jest.fn().mockReturnValue({})
  })
) as jest.Mock;

describe("MetaService", () => {
  let meta: MetaService;

  beforeEach(() => {
    meta = new MetaService(1, new Context({}));
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
      await meta.tokens(["0x01", "0x02"]);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, "https://meta.yearn.network/tokens/1/0x01");
      expect(global.fetch).toHaveBeenNthCalledWith(2, "https://meta.yearn.network/tokens/1/0x02");
    });
  });

  describe("token", () => {
    it("should fetch a single token metadata from the address given", async () => {
      await meta.token("0x00");

      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/tokens/1/0x00");
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
      await meta.vaults(["0x01", "0x02"]);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, "https://meta.yearn.network/vaults/1/0x01");
      expect(global.fetch).toHaveBeenNthCalledWith(2, "https://meta.yearn.network/vaults/1/0x02");
    });
  });

  describe("vault", () => {
    it("should fetch a single vault metadata from the address given", async () => {
      await meta.vault("0x00");

      expect(global.fetch).toHaveBeenCalledWith("https://meta.yearn.network/vaults/1/0x00");
    });
  });
});
