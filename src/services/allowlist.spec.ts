import { ChainId, Context } from "..";
import { AllowListService } from "./allowlist";

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn().mockImplementation(() => ({
    read: jest.fn()
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

describe("AllowListService", () => {
  describe("addressByChain", () => {
    describe("when chainId is 250", () => {
      it("should return the address", () => {
        const actualAddressByChain = AllowListService.addressByChain(250);

        expect(actualAddressByChain).toEqual("0xD2322468e5Aa331381200754f6daAD3dF923539e");
      });
    });

    ([1, 1337, 42161] as ChainId[]).forEach(chainId =>
      describe(`when chainId is ${chainId}`, () => {
        it("should return null", async () => {
          const actualAddressByChain = AllowListService.addressByChain(chainId);

          expect(actualAddressByChain).toBeNull();
        });
      })
    );
  });
});

describe("validateCalldata", () => {
  let allowListService: AllowListService<1>;

  beforeEach(() => {
    allowListService = new AllowListService(1, new Context({}), "0x");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addressByChain", () => {
    it("should return `false` with an error message when there is no target address", async () => {
      const actualAddressByChain = await allowListService.validateCalldata(undefined, "callData");

      expect(actualAddressByChain).toEqual({
        error: "can't validate a tx that isn't targeting an address",
        success: false
      });
    });

    it("should return `false` with an error message when there is no callData", async () => {
      const actualAddressByChain = await allowListService.validateCalldata("0x00", undefined);

      expect(actualAddressByChain).toEqual({ success: false, error: "can't validate a tx that has no call data" });
    });

    describe("when it reads from the contract", () => {
      let validateCalldataByOriginMock = jest.fn();

      beforeEach(() => {
        (allowListService.contract.read.validateCalldataByOrigin as any) = validateCalldataByOriginMock;
      });

      it("should return `false` with an error message when calldata by origin is not valid", async () => {
        validateCalldataByOriginMock.mockResolvedValue(false);

        const actualAddressByChain = await allowListService.validateCalldata("0x00", "callData");

        expect(actualAddressByChain).toEqual({ success: false, error: "tx is not permitted by the allow list" });
      });

      it("should return `true` without an error message when calldata by origin is valid", async () => {
        validateCalldataByOriginMock.mockResolvedValue(true);

        const actualAddressByChain = await allowListService.validateCalldata("0x00", "callData");

        expect(actualAddressByChain).toEqual({ success: true, error: undefined });
      });

      it("should return `false` with an error when try/catch throws", async () => {
        validateCalldataByOriginMock.mockImplementation(() => {
          throw new Error();
        });

        const actualAddressByChain = await allowListService.validateCalldata("0x00", "callData");

        expect(actualAddressByChain).toEqual({
          success: false,
          error: "failed to read from the allow list whether the transaction is valid"
        });
      });
    });
  });
});
