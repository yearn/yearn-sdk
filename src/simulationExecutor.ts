import { getAddress } from "@ethersproject/address";
import { JsonRpcProvider, JsonRpcSigner, TransactionRequest } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { ChainId } from "./chain";
import { Context } from "./context";
import { TelegramService } from "./services/telegram";
import { SimulationOptions } from "./types";
import { Address, Integer, SdkError } from "./types/common";

const baseUrl = "https://simulate.yearn.network";
const latestBlockKey = -1;
const defaultGasLimit = 8000000;
const deafultGasPrice = 0;

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
  constructor(private chainId: ChainId, private telegram: TelegramService, private ctx: Context) {}

  /**
   * Simulate a transaction
   * @param from
   * @param to
   * @param input the encoded input data as per the ethereum abi specification
   * @param value the ether value of the transaction
   * @param save whether to save the simulation so it can be later inspected,
   * @param gasLimit
   * @returns data about the simluated transaction
   */
  async simulateRaw(
    from: Address,
    to: Address,
    input: string,
    save: boolean,
    value?: Integer,
    options?: SimulationOptions
  ): Promise<any> {
    return await this.makeSimulationRequest(from, to, input, save, value, options);
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
      network_id: "1"
    };

    const response: Response = await await fetch(`${baseUrl}/fork`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(res => res.json());

    return response.simulation_fork.id;
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
      const result = await simulate(false).then(res => {
        // if the transaction used a fork and was successful then delete it
        if (forkIdToDeleteOnSuccess) {
          this.deleteFork(forkIdToDeleteOnSuccess);
        }
        return res;
      });

      return result;
    } catch (error) {
      // re-simulate the transaction with `save` set to true so the failure can be analyzed later
      // try {
      //   simulate(true);
      // } catch {}

      throw error;
    }
  }

  /**
   * Simulates an interaction with a vault to see how much of the desired token
   * will be received. This happens by inspecting the logs of the transaction and
   * finding the Transfer event where the desired token is transferred to the user.
   * @param body the input paramters of the simulation to execute
   * @param targetToken the token being bought by this transaction
   * @param from the address initiating this transaction
   * @param forkId the optional id of a fork to use if there is necessary previous state
   * @returns the amount of tokens simulated to be bought
   */
  async simulateVaultInteraction(
    from: Address,
    to: Address,
    data: string,
    targetToken: Address,
    save: boolean,
    value?: Integer,
    options?: SimulationOptions
  ): Promise<Integer> {
    let response: SimulationResponse = await this.makeSimulationRequest(from, to, data, save, value, options);

    const getAddressFromTopic = (topic: string) => {
      return getAddress(topic.slice(-40)); // the last 20 bytes of the topic is the address
    };

    const encodedTransferFunction = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // keccak256("Transfer(address,address,uint256)")

    const log = response.transaction.transaction_info.logs.find(
      log =>
        getAddress(log.raw.address) === targetToken &&
        log.raw.topics[0] === encodedTransferFunction &&
        getAddressFromTopic(log.raw.topics[2]) === from
    );

    if (!log) {
      throw new SdkError(`No log of transfering token ${targetToken} to ${from}`);
    }

    const tokensReceived = new BigNumber(log.raw.data).toFixed(0);
    return tokensReceived;
  }

  /**
   * Performs a simulation with preset paramters
   * @param from
   * @param to
   * @param data
   * @param value
   * @param save whether the simulation should be saved e.g. for inspecting later or to use as the root of another simulation
   * @param options
   * @param forkId optional fork to perform this simulation with
   * @returns the resulting data from the transaction
   */
  async makeSimulationRequest(
    from: Address,
    to: Address,
    data: string,
    save: boolean,
    value?: Integer,
    options?: SimulationOptions
  ): Promise<SimulationResponse> {
    const constructedPath = options?.forkId ? `${baseUrl}/fork/${options?.forkId}/simulate` : `${baseUrl}/simulate`;
    // console.log(constructedPath);

    const transactionRequest = await this.getPopulatedTransactionRequest(from, to, data, value, options);

    const gasLimit = +(transactionRequest.gasLimit?.toString() || "0");
    const gasPrice = transactionRequest.gasPrice?.toString();

    const body = {
      from,
      to,
      input: data,
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      simulation_type: "quick",
      root: options?.root,
      value: transactionRequest.value?.toString() || "0",
      gas: gasLimit || defaultGasLimit,
      gas_price: gasPrice || deafultGasPrice,
      // gas: defaultGasLimit,
      // gas_price: deafultGasPrice,
      save: true
    };

    const simulationResponse: SimulationResponse = await fetch(constructedPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(res => res.json());

    const errorMessage = simulationResponse.transaction.error_message;

    if (errorMessage) {
      if (save) {
        this.sendAnomolyMessage(errorMessage, simulationResponse.simulation.id, options?.forkId);
      }
      throw new SdkError(`Simulation Error - ${errorMessage}`);
    } else {
      // even though the transaction has been successful one of it's calls could have failed i.e. a partial revert might have happened
      const allCalls = this.getAllSimulationCalls(simulationResponse.transaction.transaction_info.call_trace);
      const partialRevertError = allCalls.find(call => call.error)?.error;
      if (partialRevertError) {
        const errorMessage = "Partial Revert - " + partialRevertError;
        this.sendAnomolyMessage(errorMessage, simulationResponse.simulation.id, options?.forkId);
        throw new SdkError(`Simulation Error, ${errorMessage}`);
      }
    }

    return simulationResponse;
  }

  /**
   * Sends a message to a telegram channel reporting a simulation error
   * @param errorMessage the error to be reported
   * @param simulationId the id of the simulation so the simulation failure can be inspected in the dashboard
   * @param forkId the optional id of the fork so the simulation failure can be inspected in the dashboard
   */
  private sendAnomolyMessage(errorMessage: string, simulationId: string, forkId?: string) {
    const dashboardUrl = process.env.SIMULATION_DASHBOARD_URL || "";
    const transactionUrl = `${dashboardUrl}/${forkId ? `fork/${forkId}/simulation` : "simulator"}/${simulationId}`;

    const message = ["Simulation anomoly", errorMessage, transactionUrl].join("\n\n");

    this.telegram.sendMessage(message);
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
  private async deleteFork(forkId: string) {
    return await fetch(`${baseUrl}/fork/${forkId}`, { method: "DELETE" });
  }

  /**
   * Creates a transaction object and populates it to fill in paramters such as gas price,
   * gas limit and nonce for a more accurate simulations
   * @param from
   * @param to
   * @param data
   * @param value
   * @param options
   * @returns A populated TrancactionRequest object
   */
  private async getPopulatedTransactionRequest(
    from: Address,
    to: Address,
    data: string,
    value?: Integer,
    options?: SimulationOptions
  ): Promise<TransactionRequest> {
    let signer: JsonRpcSigner;
    if (options?.forkId) {
      const provider = new JsonRpcProvider(`https://rpc.tenderly.co/fork/${options?.forkId}`);
      console.log(`https://rpc.tenderly.co/fork/${options?.forkId}`);
      signer = provider.getSigner(from);
    } else {
      signer = this.ctx.provider.write.getSigner(from);
    }

    const value2 = value || "0";
    const transactionRequest: TransactionRequest = {
      from,
      to,
      data,
      value: value2
    };

    const result = await signer.populateTransaction(transactionRequest);

    return result;
  }
}