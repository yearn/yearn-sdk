import { Context } from "@data/context";
import { JsonRpcProvider } from "@ethersproject/providers";

describe("context", () => {
  it("should throw if no provider key is provided but requested", () => {
    const ctx = new Context();
    expect(() => ctx.provider).toThrow();
    ctx.provider = new JsonRpcProvider();
    expect(() => ctx.provider).not.toThrow();
  });

  it("should throw if no etherscan key is provided but requested", () => {
    const ctx = new Context();
    expect(() => ctx.etherscan).toThrow();
    ctx.etherscan = "ABC";
    expect(() => ctx.etherscan).not.toThrow();
  });
});
