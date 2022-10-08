import { ChainId } from "../chain";
import { ContractAddressId } from "../common";
import { Context } from "../context";
import { AddressProvider } from "./addressProvider";

const contractReadAddressByIdMock = jest.fn();

const NOW = 1649826676960;

Date.now = jest.fn(() => NOW);

jest.mock("../context", () => ({
  Context: jest.fn(),
}));

jest.mock("../common", () => {
  const original = jest.requireActual("../common");
  return {
    ...original,
    WrappedContract: jest.fn(() => ({
      read: {
        addressById: (id: ContractAddressId) => contractReadAddressByIdMock(id),
      },
    })),
  };
});

describe("AddressProvider", () => {
  afterEach(() => {
    jest.clearAllMocks();
    Date.now = jest.fn(() => NOW);
  });

  describe("addressByChain", () => {
     it.each`
      chainId  | address
      ${1}     | ${"0xe11dC9f2Ab122dC5978EACA41483Da0D7D7e6128"}
      ${5}     | ${""}
      ${250}   | ${"0xac5A9E4135A3A26497F3890bFb602b06Ee592B61"}
      ${1337}  | ${"0xe11dC9f2Ab122dC5978EACA41483Da0D7D7e6128"}
      ${42161} | ${"0xcAd10033C86B0C1ED6bfcCAa2FF6779938558E9f"}
    `(`should return "$address" when chain id is "$chainId"`, ({ chainId, address }) => {
      expect(AddressProvider.addressByChain(chainId)).toBe(address);
    });

    it("should throw an error when chain id is not supported", () => {
      expect(() => AddressProvider.addressByChain(42 as ChainId)).toThrowError("Unsupported chain id: 42");
    });
  });

  ([1, 1337, 250, 42161] as ChainId[]).forEach((chainId) => {
    describe(`when chainId is ${chainId}`, () => {
      describe("addressById", () => {
        afterEach(() => {
          contractReadAddressByIdMock.mockReset();
        });

        it("should return the address from the contract if id is not cached", async () => {
          contractReadAddressByIdMock.mockResolvedValueOnce("0xContract");
          const addressProvider = new AddressProvider(chainId, new Context({}));

          const actual = await addressProvider.addressById(ContractAddressId.oracle);

          expect(actual).toEqual("0xContract");
          expect(contractReadAddressByIdMock).toHaveBeenCalledTimes(1);
          expect(contractReadAddressByIdMock).toHaveBeenCalledWith(ContractAddressId.oracle);
        });

        it("should return the address from cache if id was freshly cached", async () => {
          contractReadAddressByIdMock.mockResolvedValueOnce("0xCached");
          const addressProvider = new AddressProvider(chainId, new Context({}));
          await addressProvider.addressById(ContractAddressId.oracle);
          contractReadAddressByIdMock.mockResolvedValueOnce("0xContract");
          Date.now = jest.fn(() => NOW + 1_000); // 1 second later

          const actual = await addressProvider.addressById(ContractAddressId.oracle);

          expect(actual).toEqual("0xCached");
          expect(contractReadAddressByIdMock).toHaveBeenCalledTimes(1);
          expect(contractReadAddressByIdMock).toHaveBeenCalledWith(ContractAddressId.oracle);
        });

        it("should return the address from the contract if the cache has expired", async () => {
          contractReadAddressByIdMock.mockResolvedValueOnce("0xCached");
          const addressProvider = new AddressProvider(chainId, new Context({}));
          await addressProvider.addressById(ContractAddressId.oracle);
          contractReadAddressByIdMock.mockResolvedValueOnce("0xContract");
          Date.now = jest.fn(() => NOW + 60_000); // 1 minute later

          const actual = await addressProvider.addressById(ContractAddressId.oracle);

          expect(actual).toEqual("0xContract");
          expect(contractReadAddressByIdMock).toHaveBeenCalledTimes(2);
          expect(contractReadAddressByIdMock).toHaveBeenCalledWith(ContractAddressId.oracle);
        });

        it("should throw an error when reading from the contract fails", () => {
          contractReadAddressByIdMock.mockRejectedValueOnce(new Error("Contract read error"));
          const addressProvider = new AddressProvider(chainId, new Context({}));

          expect(() => addressProvider.addressById(ContractAddressId.oracle)).rejects.toThrow(
            new Error("Failed to read contract address for ORACLE: Error: Contract read error")
          );
          expect(contractReadAddressByIdMock).toHaveBeenCalledTimes(1);
          expect(contractReadAddressByIdMock).toHaveBeenCalledWith(ContractAddressId.oracle);
        });
      });

      describe("addressesMetadataByIdStartsWith", () => {
        it("should throw", () => {
          contractReadAddressByIdMock.mockResolvedValueOnce("0xContract");
          const addressProvider = new AddressProvider(chainId, new Context({}));

          expect(addressProvider.addressesMetadataByIdStartsWith(ContractAddressId.oracle)).rejects.toThrow(
            "tuples.map is not a function"
          );
        });
      });
    });
  });
});
