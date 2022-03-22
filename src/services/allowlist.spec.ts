import { Context } from "..";
import { AddressProvider } from "./addressProvider";
import { AllowListService } from "./allowlist";

const validateCalldataByOriginMock = jest.fn();

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn().mockImplementation(() => ({
    validateCalldataByOrigin: validateCalldataByOriginMock
  }))
}));

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: jest.fn(),
    events: {
      on: jest.fn()
    }
  }))
}));

describe("validateCalldata", () => {
  let allowListService: AllowListService<1>;
  const addressProvider = new AddressProvider(1, new Context({}));

  beforeEach(() => {
    allowListService = new AllowListService(1, new Context({}), addressProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateCalldata", () => {
    it("should return `false` with an error message when there is no target address", async () => {
      const actual = await allowListService.validateCalldata(undefined, "callData");

      expect(actual).toEqual({
        error: "can't validate a tx that isn't targeting an address",
        success: false
      });
    });

    it("should return `false` with an error message when there is no callData", async () => {
      const actual = await allowListService.validateCalldata("0x00", undefined);

      expect(actual).toEqual({ success: false, error: "can't validate a tx that has no call data" });
    });

    describe("when it reads from the contract", () => {
      beforeEach(() => {
        jest.spyOn(AddressProvider.prototype, "addressById").mockImplementation(() => Promise.resolve("0x00"));
      });

      it("should return `false` with an error message when calldata by origin is not valid", async () => {
        validateCalldataByOriginMock.mockResolvedValue(false);

        const actual = await allowListService.validateCalldata("0x00", "callData");

        expect(actual).toEqual({ success: false, error: "tx is not permitted by the allow list" });
      });

      it("should return `true` without an error message when calldata by origin is valid", async () => {
        validateCalldataByOriginMock.mockResolvedValue(true);

        const actual = await allowListService.validateCalldata("0x00", "callData");

        expect(actual).toEqual({ success: true, error: undefined });
      });

      it("should return `false` with an error when try/catch throws", async () => {
        validateCalldataByOriginMock.mockImplementation(() => {
          throw new Error();
        });

        const actual = await allowListService.validateCalldata("0x00", "callData");

        expect(actual).toEqual({
          success: false,
          error: "failed to read from the allow list whether the transaction is valid"
        });
      });
    });

    describe("when it doesn't read from the contract", () => {
      beforeEach(async () => {
        jest.spyOn(AddressProvider.prototype, "addressById").mockImplementation(() => Promise.reject());
      });

      it("should return `true` skipping validation", async () => {
        const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
        const actual = await allowListService.validateCalldata("0x00", "callData");

        expect(actual).toEqual({ success: true, error: undefined });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Contract address for ALLOW_LIST_REGISTRY is missing from the Address Provider"
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "AllowList on-chain contract address missing. Skipping validation..."
        );
      });
    });
  });
});
