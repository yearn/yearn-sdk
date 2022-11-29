import { getAddress } from "@ethersproject/address";
import { BytesLike } from "@ethersproject/bytes";
import BigNumber from "bignumber.js";

import { ChainId } from "./chain";
import { Context } from "./context";
import { TelegramService } from "./services/telegram";
import { SimulationError, SimulationOptions, TenderlyError } from "./types";
import { Address, Integer } from "./types/common";

const baseUrl = "https://simulate.yearn.network";
const latestBlockKey = -1;

export interface SimulationResponse {
  transaction: {
    transaction_info: {
      call_trace: SimulationCallTrace;
      logs: SimulationLog[];
    };
    error_message?: string;
  };
  simulation: {
    id: string;
  };
}

interface SimulationLog {
  raw: {
    address: Address;
    topics: string[];
    data: string;
  };
}

interface SimulationCallTrace {
  output: Integer;
  calls: SimulationCallTrace[] | null;
  error?: string;
}

/**
 * [[SimulationExecutor]] performs simulation requests and returns the response
 * with no data manipulation. If the simulation results in an error then an alert is sent
 * via telegram if the appropriate environment variables are set. Forks are necessary to be
 * created if two subsequent simulations are needed e.g. if a zap in is wished to be simulated
 * but the user has not approved the zap contract then the steps to simulate it are:
 * 1. Create a fork
 * 2. Simulate the approval transaction using this fork
 * 3. Simulate the zap in using the approval transaction as the root
 */
export class SimulationExecutor {
  constructor(private telegram: TelegramService, private chainId: ChainId, private ctx: Context) {}

  /**
   * Simulate a transaction
   * @param from
   * @param to
   * @param input the encoded input data as per the ethereum abi specification
   * @param value the ether value of the transaction
   * @param options simulation options
   * @returns data about the simulated transaction
   */
  async simulateRaw(
    from: Address,
    to: Address,
    input: string,
    options: SimulationOptions = {},
    value: Integer = "0"
  ): Promise<SimulationResponse> {
    return await this.makeSimulationRequest(from, to, input, options, value);
  }

  /**
   * Simulates an interaction with a vault to see how much of the desired token
   * will be received. This happens by inspecting the logs of the transaction and
   * finding the Transfer event where the desired token is transferred to the user.
   * @param from
   * @param to
   * @param data
   * @param targetToken the token being bought by this transaction
   * @param from the address initiating this transaction
   * @param options
   * @param value
   * @returns the amount of tokens simulated to be bought
   */
  async simulateVaultInteraction(
    from: Address,
    to: Address,
    data: BytesLike,
    targetToken: Address,
    options: SimulationOptions,
    value: Integer = "0"
  ): Promise<Integer> {
    if (!this.isString(data)) {
      throw new SimulationError("Data is of an invalid type", SimulationError.INVALID_TYPE);
    }

    const response: SimulationResponse = await this.makeSimulationRequest(from, to, data, options, value);

    const getAddressFromTopic = (topic: string): Address => {
      return getAddress(topic.slice(-40)); // the last 20 bytes of the topic is the address
    };

    const encodedTransferFunction = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // keccak256("Transfer(address,address,uint256)")

    const log = response.transaction.transaction_info.logs
      .reverse()
      .find(
        (log) =>
          log.raw.topics[0] === encodedTransferFunction && getAddressFromTopic(log.raw.topics[2]) === getAddress(from)
      );

    if (!log) {
      throw new SimulationError(`No log of transferring token ${targetToken} to ${from}`, SimulationError.NO_LOG);
    }

    const tokensReceived = new BigNumber(log.raw.data).toFixed(0);
    return tokensReceived;
  }

  /**
   * Performs a simulation with preset parameters
   * @param from
   * @param to
   * @param data
   * @param options
   * @param value
   * @returns the resulting data from the transaction
   */
  async makeSimulationRequest(
    from: Address,
    to: Address,
    data: BytesLike,
    options: SimulationOptions,
    value: Integer = "0"
  ): Promise<SimulationResponse> {
    if (!this.isString(data)) {
      throw new SimulationError("Data is of an invalid type", SimulationError.INVALID_TYPE);
    }

    const constructedPath = options?.forkId ? `${baseUrl}/fork/${options.forkId}/simulate` : `${baseUrl}/simulate`;
    const body = {
      from,
      to,
      input: data,
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      simulation_type: "quick",
      root: options?.root,
      value: value,
      save: options.save || true,
    };

    const simulationResponse = await fetch(constructedPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .catch(() => {
        throw new TenderlyError("simulation call to Tenderly failed", TenderlyError.SIMULATION_CALL);
      });

    const errorMessage = simulationResponse.transaction.error_message;

    if (errorMessage) {
      if (options.save) {
        this.sendErrorMessage(errorMessage, simulationResponse.simulation.id, options.forkId);
      }
      throw new SimulationError(errorMessage, SimulationError.TENDERLY_RESPONSE_ERROR);
    } else {
      // even though the transaction has been successful one of it's calls could have failed i.e. a partial revert might have happened
      const allCalls = this.getAllSimulationCalls(simulationResponse.transaction.transaction_info.call_trace);
      const partialRevertError = allCalls.find((call) => call.error)?.error;
      if (partialRevertError) {
        const errorMessage = "Partial Revert - " + partialRevertError;
        this.sendErrorMessage(errorMessage, simulationResponse.simulation.id, options?.forkId);
        throw new SimulationError(errorMessage, SimulationError.PARTIAL_REVERT);
      }
    }

    return simulationResponse;
  }

  /**
   * Simulates a transaction, with the `save` parameter initially set to `false`. If this simulation fails then
   * the simulation is re-executed but with `save` set to `true` so the failure can be stored and later analyzed.
   * @param simulate the function which executes the simulation, passing in `save` as an argument.
   * @param forkIdToDeleteOnSuccess if the simulation is successful there is no reason to save it. Delete the fork to avoid clutter
   * @returns the result of the simulate parameter
   */
  async executeSimulationWithReSimulationOnFailure<T>(
    simulate: (save: boolean) => Promise<T>,
    forkIdToDeleteOnSuccess: string | null = null
  ): Promise<T> {
    try {
      const result = await simulate(false).then((res) => {
        // if the transaction used a fork and was successful then delete it
        if (forkIdToDeleteOnSuccess) {
          this.deleteFork(forkIdToDeleteOnSuccess);
        }
        return res;
      });

      return result;
    } catch (error) {
      // re-simulate the transaction with `save` set to true so the failure can be analyzed later
      try {
        await simulate(true);
      } catch (error) {
        console.error(error);
      }

      throw error;
    }
  }

  /**
   * Create a new fork that can be used to simulate multiple sequential transactions on
   * e.g. approval followed by a deposit.
   * @returns the uuid of a new fork that has been created
   */
  async createFork(): Promise<string> {
    interface Response {
      simulation_fork: {
        id: string;
      };
    }

    const body = {
      alias: "",
      description: "",
      network_id: this.chainId.toString(),
    };

    const response: Response = await await fetch(`${baseUrl}/fork`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .catch(() => {
        throw new TenderlyError("failed to create fork", TenderlyError.CREATE_FORK);
      });

    return response.simulation_fork.id;
  }

  /**
   * Recursively loops through the simulation call trace, aggregating all calls into a flattened array.
   * @param callTrace the starting call trace to inspect
   * @returns a flattened array of call data
   */
  private getAllSimulationCalls(callTrace: SimulationCallTrace): SimulationCallTrace[] {
    let result: SimulationCallTrace[] = [];
    result = result.concat(callTrace.calls || []);
    for (const calls of callTrace.calls || []) {
      const res = this.getAllSimulationCalls(calls);
      result = result.concat(res);
    }
    return result;
  }

  /**
   * Deletes a fork. This should be done after its successful use in order to avoid clutter.
   * @param forkId the fork to be deleted
   * @returns the deletion response
   */
  async deleteFork(forkId: string): Promise<Response> {
    return await fetch(`${baseUrl}/fork/${forkId}`, { method: "DELETE" });
  }

  /**
   * Sends a message to a telegram channel reporting a simulation error
   * @param errorMessage the error to be reported
   * @param simulationId the id of the simulation so the simulation failure can be inspected in the dashboard
   * @param forkId the optional id of the fork so the simulation failure can be inspected in the dashboard
   */
  private sendErrorMessage(errorMessage: string, simulationId: string, forkId?: string): void {
    let transactionUrl: string | undefined;
    if (this.ctx.simulation.dashboardUrl) {
      transactionUrl = `${this.ctx.simulation.dashboardUrl}/${
        forkId ? `fork/${forkId}/simulation` : "simulator"
      }/${simulationId}`;
    }

    const message = ["Simulation error", errorMessage, transactionUrl].map((item) => item).join("\n\n");

    this.telegram.sendMessage(message);
  }

  private isString(data: BytesLike): data is string {
    return typeof data === "string";
  }
}
