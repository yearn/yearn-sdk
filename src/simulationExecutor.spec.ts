/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonRpcSigner } from "@ethersproject/providers";

import { TelegramService } from ".";
import { Context } from "./context";
import { SimulationExecutor } from "./simulationExecutor";
import { EthersError, SimulationError, TenderlyError } from "./types";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: jest.fn().mockReturnValue({
      simulation: {
        id: "simulation-id",
      },
      transaction: {
        transaction_info: {
          call_trace: { calls: [] },
        },
      },
    }),
  })
) as jest.Mock;

const populateTransactionMock = jest.fn().mockReturnValue(Promise.resolve(true));

jest.mock("@ethersproject/providers");
jest.mock("@ethersproject/contracts");

const SignerMock = JsonRpcSigner as jest.Mocked<typeof JsonRpcSigner>;

const buildSignerMock = (balance = 1, transactionCount = 1): any => {
  const getBalanceMock = jest.fn().mockImplementation(() => Promise.resolve(balance));

  const getTransactionCountMock = jest.fn().mockImplementation(() => Promise.resolve(transactionCount));

  const signer = new SignerMock("0x00", "provider" as any) as any;
  signer.getBalance = getBalanceMock;
  signer.getTransactionCount = getTransactionCountMock;
  signer.getSigner = (): any => signer;
  signer.populateTransaction = populateTransactionMock;
  return signer;
};

jest.mock("./services/telegram", () => ({
  TelegramService: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn(),
  })),
}));

jest.mock("./context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      write: buildSignerMock(),
    },
    simulation: {
      dashboardUrl: "dashboard-url",
    },
  })),
}));

describe("Simulation executor", () => {
  let simulationExecutor: SimulationExecutor;
  const MockedTelegramServiceClass = TelegramService as jest.Mock<TelegramService>;

  beforeEach(() => {
    const mockedTelegramService = new MockedTelegramServiceClass();
    simulationExecutor = new SimulationExecutor(mockedTelegramService, 1, new Context({}));
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("simulateRaw", () => {
    it("should call `makeSimulationRequest` with correct params", async () => {
      expect.assertions(2);
      const makeSimulationRequestSpy = jest.spyOn(simulationExecutor, "makeSimulationRequest");

      await simulationExecutor.simulateRaw("0x000", "0x000", "1", {}, "2");

      expect(makeSimulationRequestSpy).toHaveBeenCalledTimes(1);
      expect(makeSimulationRequestSpy).toHaveBeenCalledWith("0x000", "0x000", "1", {}, "2");
    });
  });

  describe("simulateVaultInteraction", () => {
    let spy: jest.SpyInstance;
    beforeEach(() => {
      spy = jest.spyOn(simulationExecutor, "makeSimulationRequest").mockReturnValueOnce(
        Promise.resolve({
          simulation: {
            id: "",
          },
          transaction: {
            transaction_info: {
              call_trace: { output: "", calls: [] },
              logs: [],
            },
          },
        })
      );
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it("should fail with SimulationError no log", async () => {
      expect.assertions(2);
      try {
        await simulationExecutor.simulateVaultInteraction("0x000", "0x000", "1", "0x0000", {});
      } catch (error) {
        expect(error).toBeInstanceOf(SimulationError);
        expect(error).toHaveProperty("error_code", SimulationError.NO_LOG);
      }
    });
  });

  describe("makeSimulationRequest", () => {
    it("should fail with EthersError populating transaction", async () => {
      expect.assertions(2);
      populateTransactionMock.mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationExecutor.makeSimulationRequest("0x000", "0x000", "1", {});
      } catch (error) {
        expect(error).toBeInstanceOf(EthersError);
        expect(error).toHaveProperty("error_code", EthersError.POPULATING_TRANSACTION);
      }
    });

    it("should fail with TenderlyError simulation call", async () => {
      expect.assertions(2);
      (global.fetch as jest.Mock).mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationExecutor.makeSimulationRequest("0x000", "0x000", "1", {});
      } catch (error) {
        expect(error).toBeInstanceOf(TenderlyError);
        expect(error).toHaveProperty("error_code", TenderlyError.SIMULATION_CALL);
      }
    });

    it("should fail with SimulationError tenderly response error", async () => {
      expect.assertions(3);
      (global.fetch as jest.Mock).mockReturnValueOnce(
        Promise.resolve({
          json: jest.fn().mockReturnValue({
            transaction: {
              error_message: "some error",
            },
          }),
        })
      );
      try {
        await simulationExecutor.makeSimulationRequest("0x000", "0x000", "1", {});
      } catch (error) {
        expect(error).toBeInstanceOf(SimulationError);
        expect(error).toHaveProperty("error_code", SimulationError.TENDERLY_RESPONSE_ERROR);
        expect(error).toHaveProperty("message", "some error");
      }
    });

    it("should fail with SimulationError partial revert", async () => {
      expect.assertions(2);
      (global.fetch as jest.Mock).mockReturnValueOnce(
        Promise.resolve({
          json: jest.fn().mockReturnValue({
            simulation: {
              id: "simulation-id",
            },
            transaction: {
              transaction_info: {
                call_trace: { calls: [{ error: "some error happened " }] },
              },
            },
          }),
        })
      );
      try {
        await simulationExecutor.makeSimulationRequest("0x000", "0x000", "1", {});
      } catch (error) {
        expect(error).toBeInstanceOf(SimulationError);
        expect(error).toHaveProperty("error_code", SimulationError.PARTIAL_REVERT);
      }
    });
  });

  describe("executeSimulationWithReSimulationOnFailure", () => {
    const simulateFn = jest.fn();
    const deleteForkSpy = jest.spyOn(SimulationExecutor.prototype as any, "deleteFork");

    describe("when the simulation is successful", () => {
      beforeEach(() => {
        simulateFn.mockResolvedValueOnce(true);
      });

      it("should return the result", async () => {
        const actual = await simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, null);

        expect(actual).toEqual(true);
        expect(simulateFn).toHaveBeenCalledTimes(1);
        expect(simulateFn).toHaveBeenCalledWith(false);
        expect(deleteForkSpy).not.toHaveBeenCalled();
      });

      it("should delete the fork when one was used by the transaction", async () => {
        const actual = await simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, "42");

        expect(actual).toEqual(true);
        expect(simulateFn).toHaveBeenCalledTimes(1);
        expect(simulateFn).toHaveBeenCalledWith(false);
        expect(deleteForkSpy).toHaveBeenCalledTimes(1);
        expect(deleteForkSpy).toHaveBeenCalledWith("42");
      });
    });

    describe("when the first simulation fails", () => {
      it("should re-simulate the transaction with `save` set to `true` when the first simulation fails", async () => {
        simulateFn.mockRejectedValueOnce(new Error("simulation failed"));
        simulateFn.mockResolvedValueOnce(true);

        await expect(
          simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, "42")
        ).rejects.toThrowError("simulation failed");
        expect(simulateFn).toHaveBeenCalledTimes(2);
        expect(simulateFn).toHaveBeenNthCalledWith(1, false);
        expect(simulateFn).toHaveBeenNthCalledWith(2, true);
        expect(console.error).not.toHaveBeenCalled();
      });
    });

    describe("when the first and second simulation fail", () => {
      beforeEach(() => {
        simulateFn.mockRejectedValueOnce(new Error("simulation failed"));
        simulateFn.mockRejectedValue(new Error("re-simulation failed"));
      });

      it("should re-simulate the transaction with `save` set to `true` and log the second error", async () => {
        await expect(
          simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, "42")
        ).rejects.toThrowError("simulation failed");
        expect(simulateFn).toHaveBeenCalledTimes(2);
        expect(simulateFn).toHaveBeenNthCalledWith(1, false);
        expect(simulateFn).toHaveBeenNthCalledWith(2, true);
        expect(console.error).toHaveBeenCalledWith(new Error("re-simulation failed"));
      });
    });
  });

  describe("createFork", () => {
    it("should fail with TenderlyError create fork", async () => {
      expect.assertions(2);
      (global.fetch as jest.Mock).mockReturnValueOnce(Promise.reject(new Error("something bad happened")));
      try {
        await simulationExecutor.createFork();
      } catch (error) {
        expect(error).toBeInstanceOf(TenderlyError);
        expect(error).toHaveProperty("error_code", TenderlyError.CREATE_FORK);
      }
    });
  });
});
