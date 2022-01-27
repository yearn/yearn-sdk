import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";

import { SdkError } from "..";
import { Context } from "../context";
import { SimulationExecutor } from "../simulationExecutor";
import { EthersError, PriceFetchingError, ZapperError } from "../types/custom/simulation";
import { Yearn } from "../yearn";
import { SimulationInterface } from "./simulation";

const tokenMock = jest.fn(() => Promise.resolve("0x0000000000000000000000000000000000000001"));
const decimalsMock = jest.fn(() => Promise.resolve(1));
const pricePerShareMock = jest.fn(() => Promise.resolve(1));
const zapInApprovalStateMock = jest.fn(() => Promise.resolve({ isApproved: false }));
const zapInApprovalTransactionMock = jest.fn(() => Promise.resolve({ from: "0x000", to: "0x000", data: "" }));
const zapOutApprovalStateMock = jest.fn(() => Promise.resolve({ isApproved: false }));
const zapOutApprovalTransactionMock = jest.fn(() => Promise.resolve({ from: "0x000", to: "0x000", data: "" }));
const getNormalizedValueUsdcMock = jest.fn(() => Promise.resolve("10"));
const zapInMock = jest.fn(() => Promise.resolve(true));
const zapOutMock = jest.fn(() => Promise.resolve(true));

jest.mock("@ethersproject/providers");
jest.mock("@ethersproject/contracts");
jest.mock("../vault", () => ({
  PickleJarContract: jest.fn().mockImplementation(() => ({
    token: tokenMock,
    decimals: decimalsMock,
    pricePerShare: pricePerShareMock,
    encodeDeposit: jest.fn().mockReturnValue(Promise.resolve(""))
  })),
  YearnVaultContract: jest.fn().mockImplementation(() => ({
    token: tokenMock,
    decimals: decimalsMock,
    pricePerShare: pricePerShareMock,
    encodeDeposit: jest.fn().mockReturnValue(Promise.resolve(""))
  }))
}));

const SignerMock = JsonRpcSigner as jest.Mocked<typeof JsonRpcSigner>;

const buildSignerMock = (balance = 1, transactionCount = 1) => {
  const getBalanceMock = jest.fn().mockImplementation(() => Promise.resolve(balance));

  const getTransactionCountMock = jest.fn().mockImplementation(() => Promise.resolve(transactionCount));

  const signer = new SignerMock("0x00", "provider" as any) as any;
  signer.getBalance = getBalanceMock;
  signer.getTransactionCount = getTransactionCountMock;
  signer.getSigner = () => signer;
  return signer;
};

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      telegram: jest.fn(),
      oracle: {
        getNormalizedValueUsdc: getNormalizedValueUsdcMock
      },
      pickle: {
        getPriceUsdc: getNormalizedValueUsdcMock
      },
      zapper: {
        zapInApprovalState: zapInApprovalStateMock,
        zapInApprovalTransaction: zapInApprovalTransactionMock,
        zapOutApprovalState: zapOutApprovalStateMock,
        zapOutApprovalTransaction: zapOutApprovalTransactionMock,
        zapIn: zapInMock,
        zapOut: zapOutMock
      }
    }
  }))
}));
jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      write: buildSignerMock()
    }
  }))
}));

describe("Simulation interface", () => {
  let simulationInterface: SimulationInterface<1>;
  const MockedYearnClass = Yearn as jest.Mock<Yearn<1>>;

  beforeEach(() => {
    const mockedYearn = new MockedYearnClass();
    simulationInterface = new SimulationInterface(mockedYearn, 1, new Context({ disableAllowlist: true }));
    jest.spyOn(SimulationExecutor.prototype, "makeSimulationRequest").mockReturnValueOnce(
      Promise.resolve({
        transaction: {
          transaction_info: {
            call_trace: { output: "1", calls: null },
            logs: []
          }
        },
        simulation: {
          id: "id"
        }
      })
    );
    jest.spyOn(SimulationExecutor.prototype, "createFork").mockReturnValue(Promise.resolve("1"));
    jest.spyOn(SimulationExecutor.prototype, "simulateVaultInteraction").mockReturnValue(Promise.resolve("1"));
    (Contract as any).prototype.allowance = jest.fn().mockReturnValue(Promise.resolve("100000000000"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("deposit", () => {
    it("should fail with Ethers Error failed to fetch token", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.deposit("0x000", "0x000", "1", "0x000");
      } catch (error) {
        expect(error).toBeInstanceOf(EthersError);
        expect(error).toHaveProperty("error_code", EthersError.FAIL_TOKEN_FETCH);
      }
    });

    it("should fail with SDK no slippage error if none was passed", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      try {
        await simulationInterface.deposit("0x000", "0x000", "1", "0x000");
      } catch (error) {
        expect(error).toBeInstanceOf(SdkError);
        expect(error).toHaveProperty("error_code", SdkError.NO_SLIPPAGE);
      }
    });

    it("should fail with ZapperError zap in approval state error", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      zapInApprovalStateMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.deposit("0x000", "0x000", "1", "0x000", { slippage: 1 });
      } catch (error) {
        expect(error).toBeInstanceOf(ZapperError);
        expect(error).toHaveProperty("error_code", ZapperError.ZAP_IN_APPROVAL_STATE);
      }
    });

    it("should fail with ZapperError zap in approval", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      zapInApprovalStateMock.mockReturnValueOnce(Promise.resolve({ isApproved: false }));
      zapInApprovalTransactionMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.deposit("0x000", "0x000", "1", "0x000", { slippage: 1 });
      } catch (error) {
        expect(error).toBeInstanceOf(ZapperError);
        expect(error).toHaveProperty("error_code", ZapperError.ZAP_IN_APPROVAL);
      }
    });

    it("should fail with ZapperError zap in", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      zapInMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.deposit("0x000", "0x000", "1", "0x000", { slippage: 1 });
      } catch (error) {
        expect(error).toBeInstanceOf(ZapperError);
        expect(error).toHaveProperty("error_code", ZapperError.ZAP_IN);
      }
    });

    it("should fail with No decimals error", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      decimalsMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.deposit("0x000", "0x000", "1", "0x000", { slippage: 1 });
      } catch (error) {
        expect(error).toBeInstanceOf(EthersError);
        expect(error).toHaveProperty("error_code", EthersError.NO_DECIMALS);
      }
    });

    it("should fail with No price per share error", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      pricePerShareMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.deposit("0x000", "0x000", "1", "0x000", { slippage: 1 });
      } catch (error) {
        expect(error).toBeInstanceOf(EthersError);
        expect(error).toHaveProperty("error_code", EthersError.NO_PRICE_PER_SHARE);
      }
    });

    it("should fail with PriceFetchingError while fetching the oracle price", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      getNormalizedValueUsdcMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.deposit("0x000", "0x000", "1", "0x000", { slippage: 1 });
      } catch (error) {
        expect(error).toBeInstanceOf(PriceFetchingError);
        expect(error).toHaveProperty("error_code", PriceFetchingError.FETCHING_PRICE_ORACLE);
      }
    });

    it("should fail with PriceFetchingError while fetching the pickle price", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      getNormalizedValueUsdcMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.deposit("0x000", "0x000", "1", "0xCeD67a187b923F0E5ebcc77C7f2F7da20099e378", {
          slippage: 1
        });
      } catch (error) {
        expect(error).toBeInstanceOf(PriceFetchingError);
        expect(error).toHaveProperty("error_code", PriceFetchingError.FETCHING_PRICE_PICKLE);
      }
    });

    it("should fail with PriceFetchingError while fetching the oracle price", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      getNormalizedValueUsdcMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.deposit("0x000", "0x001", "1", "0x0000", { slippage: 1 });
      } catch (error) {
        expect(error).toBeInstanceOf(PriceFetchingError);
        expect(error).toHaveProperty("error_code", PriceFetchingError.FETCHING_PRICE_ORACLE);
      }
    });
  });

  describe("withdraw", () => {
    it("should fail with SDK no slippage error if none was passed", async () => {
      expect.assertions(2);
      tokenMock.mockImplementationOnce(() => Promise.resolve("0x001"));
      try {
        await simulationInterface.withdraw("0x000", "0x000", "1", "0x0000000000000000000000000000000000000001");
      } catch (error) {
        expect(error).toBeInstanceOf(SdkError);
        expect(error).toHaveProperty("error_code", SdkError.NO_SLIPPAGE);
      }
    });

    it("should fail with ZapperError zap out approval state error", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      zapOutApprovalStateMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.withdraw("0x000", "0x000", "1", "0x0000000000000000000000000000000000000001", {
          slippage: 1
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ZapperError);
        expect(error).toHaveProperty("error_code", ZapperError.ZAP_OUT_APPROVAL_STATE);
      }
    });

    it("should fail with ZapperError zap out approval", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      zapOutApprovalStateMock.mockReturnValueOnce(Promise.resolve({ isApproved: false }));
      zapOutApprovalTransactionMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.withdraw("0x000", "0x000", "1", "0x0000000000000000000000000000000000000001", {
          slippage: 1
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ZapperError);
        expect(error).toHaveProperty("error_code", ZapperError.ZAP_OUT_APPROVAL);
      }
    });

    it("should fail with ZapperError zap out", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      zapOutMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.withdraw("0x000", "0x000", "1", "0x0000000000000000000000000000000000000001", {
          slippage: 1
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ZapperError);
        expect(error).toHaveProperty("error_code", ZapperError.ZAP_OUT);
      }
    });

    it("should fail with PriceFetchingError while fetching the oracle price", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      getNormalizedValueUsdcMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.withdraw("0x000", "0x000", "1", "0x0000000000000000000000000000000000000001", {
          slippage: 1
        });
      } catch (error) {
        expect(error).toBeInstanceOf(PriceFetchingError);
        expect(error).toHaveProperty("error_code", PriceFetchingError.FETCHING_PRICE_ORACLE);
      }
    });

    it("should fail with PriceFetchingError while fetching the oracle price", async () => {
      expect.assertions(2);
      tokenMock.mockReturnValueOnce(Promise.resolve("0x001"));
      getNormalizedValueUsdcMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationInterface.withdraw("0x000", "0x000", "1", "0x0000000000000000000000000000000000000001", {
          slippage: 1
        });
      } catch (error) {
        expect(error).toBeInstanceOf(PriceFetchingError);
        expect(error).toHaveProperty("error_code", PriceFetchingError.FETCHING_PRICE_ORACLE);
      }
    });
  });
});
