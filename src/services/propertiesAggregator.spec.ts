import { ParamType } from "@ethersproject/abi";

import { ChainId } from "../chain";
import { ContractAddressId } from "../common";
import { Context } from "../context";
import { AddressProvider } from "./addressProvider";
import { PropertiesAggregatorService } from "./propertiesAggregator";

const targetAddress = "0x5D7201c10AfD0Ed1a1F408E321Ef0ebc7314B086";

jest.mock("./addressProvider", () => ({
  AddressProvider: jest.fn().mockImplementation(() => ({
    addressById: jest.fn().mockResolvedValue(targetAddress),
  })),
}));

jest.mock("@ethersproject/abi", () => {
  const original = jest.requireActual("@ethersproject/abi");
  return {
    ...original,
    defaultAbiCoder: {
      decode: jest.fn().mockReturnValue("decoded"),
    },
  };
});

describe("PropertiesAggregatorService", () => {
  let propertiesAggregatorService: PropertiesAggregatorService<1>;
  let mockedAddressProvider: AddressProvider<ChainId>;
  let context: Context;
  let getPropertyMock: jest.Mock;
  let getPropertiesMock: jest.Mock;

  beforeEach(() => {
    mockedAddressProvider = new (AddressProvider as unknown as jest.Mock<AddressProvider<ChainId>>)();
    context = new Context({});
    propertiesAggregatorService = new PropertiesAggregatorService(1, context, mockedAddressProvider);
    getPropertyMock = jest.fn();
    getPropertiesMock = jest.fn();
    Object.defineProperty(propertiesAggregatorService, "_getContract", {
      value: jest.fn().mockResolvedValue({
        read: { getProperty: getPropertyMock, getProperties: getPropertiesMock },
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("address provider type", () => {
    it("should be properties aggregator service contract id", () => {
      expect(PropertiesAggregatorService.contractId).toEqual(ContractAddressId.propertiesAggregator);
    });
  });

  describe("getProperty", () => {
    it("should call the properties aggregator contract's getProperty method", async () => {
      const propertyName = "name";
      const paramType = ParamType.from(`string ${propertyName}`);
      await propertiesAggregatorService.getProperty(targetAddress, paramType);

      expect(getPropertyMock).toHaveBeenCalledTimes(1);
      expect(getPropertyMock).toHaveBeenCalledWith(targetAddress, propertyName);
    });
  });

  describe("getProperty", () => {
    beforeEach(() => {
      getPropertiesMock.mockReturnValue(["firstResult", "secondResult"]);
    });

    it("should call the properties aggregator contract's getProperties method", async () => {
      const paramTypes = [ParamType.from("string name"), ParamType.from("uint256 totalAssets")];
      await propertiesAggregatorService.getProperties(targetAddress, paramTypes);
      const propertyNames = paramTypes.map((type) => type.name);

      expect(getPropertiesMock).toHaveBeenCalledTimes(1);
      expect(getPropertiesMock).toHaveBeenCalledWith(targetAddress, propertyNames);
    });
  });
});
