import { Context } from "..";
import { PartnerService } from "./partner";

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    events: {
      on: jest.fn()
    },
    provider: {},
    partnerId: "partnerid"
  }))
}));

describe("VaultInterface", () => {
  let partner: PartnerService<1>;

  beforeEach(() => {
    partner = new PartnerService(1, new Context({}), "0x8ee392a4787397126c163cb9844d7c447da419d8");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("deposit", () => {
    it("should call the contract deposit", () => {
      // got to work around the fact that write is read-only
      Object.defineProperty(partner.contract, "write", {
        value: { deposit: jest.fn() },
        configurable: true,
        writable: true
      });
      const spy = jest.spyOn(partner.contract.write, "deposit");

      partner.deposit("vault", "0.11", { from: "0x0001" });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("vault", "partnerid", "0.11", { from: "0x0001" });
    });
  });

  describe("encodeDeposit", () => {
    it("should call the contract deposit", () => {
      const spy = jest.spyOn(partner.contract.write.interface, "encodeFunctionData").mockImplementation();

      partner.encodeDeposit("vault", "0.11");

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("deposit", ["vault", "partnerid", "0.11"]);
    });
  });
});
