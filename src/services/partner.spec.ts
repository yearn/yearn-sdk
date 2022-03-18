import { ChainId, Context } from "..";
import { AddressProvider } from "./addressProvider";
import { PartnerService } from "./partner";

const sendTransactionMock = jest.fn();

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    events: {
      on: jest.fn()
    },
    provider: {},
    partnerId: "partnerid",
    write: {
      getSigner: jest.fn().mockImplementation(() => ({
        sendTransaction: sendTransactionMock
      }))
    }
  }))
}));

jest.mock("./addressProvider", () => ({
  AddressProvider: jest.fn().mockImplementation(() => ({
    addressById: jest.fn().mockResolvedValue("0xe11dC9f2Ab122dC5978EACA41483Da0D7D7e6128")
  }))
}));

describe("PartnerService", () => {
  let partner: PartnerService<1>;
  let mockedAddressProvider: AddressProvider<ChainId>;
  let encodeFunctionDataMock: jest.Mock;
  let depositMock: jest.Mock;

  beforeEach(() => {
    mockedAddressProvider = new ((AddressProvider as unknown) as jest.Mock<AddressProvider<ChainId>>)();
    partner = new PartnerService(1, new Context({}), mockedAddressProvider);
    encodeFunctionDataMock = jest.fn();
    depositMock = jest.fn();
    Object.defineProperty(partner, "_getContract", {
      value: jest.fn().mockResolvedValue({
        write: { deposit: depositMock, interface: { encodeFunctionData: encodeFunctionDataMock } }
      }),
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("deposit", () => {
    it("should call the contract deposit", async () => {
      await partner.deposit("vault", "0.11", { from: "0x0001" });

      expect(depositMock).toHaveBeenCalledTimes(1);
      expect(depositMock).toHaveBeenCalledWith("vault", "partnerid", "0.11", { from: "0x0001" });
    });
  });

  describe("encodeDeposit", () => {
    it("should call the contract deposit", async () => {
      await partner.encodeDeposit("vault", "0.11");

      expect(encodeFunctionDataMock).toHaveBeenCalledTimes(1);
      expect(encodeFunctionDataMock).toHaveBeenCalledWith("deposit", ["vault", "partnerid", "0.11"]);
    });
  });
});
