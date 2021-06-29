import BigNumber from "bignumber.js";
import { Service } from "../common";
import { Address, Integer, SdkError, ZapInOutput } from "../types";

const baseUrl = "https://api.tenderly.co/api/v1/account/yearn/project/yearn-web";

interface TransactionOutcome {
  sourceTokenAddress: Address;
  sourceTokenAmount: Integer;
  targetTokenAddress: Address;
  targetTokenAmount: Integer;
  conversionRate: number;
  slippage: number;
}

/**
 * [[OracleService]] allows the simulation of ethereum transactions using Tenderly's api.
 * This allows us to know information before executing a transaction on mainnet.
 * For example it can simulate how much slippage is likely to be experienced when withdrawing from a vault,
 * or how many underlying tokens the user will receive upon withdrawing share tokens.
 */
export class SimulationService extends Service {
  /**
   * Create a new fork that can be used to simulate multiple sequential transactions on
   * e.g. approval followed by a deposit.
   * @returns the uuid of a new fork that has been created
   */
  async createForkWithId(): Promise<String> {
    interface Response {
      simulation_fork: {
        id: String;
      };
    }

    const body = {
      alias: "",
      description: "",
      network_id: "1"
    };

    const response: Response = await fetch(`${baseUrl}/fork`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // "X-Access-Key": "" // Todo - inject the api key using a CORS proxy
      },
      body: JSON.stringify(body)
    }).then(res => res.json());

    return response.simulation_fork.id;
  }

  /**
   * Simulate a transaction
   * @param block the block number to simluate the transaction at
   * @param from
   * @param to
   * @param input the encoded input data as per the ethereum abi specification
   * @returns data about the simluated transaction
   */
  async simulateRaw(block: number, from: Address, to: Address, input: String): Promise<any> {
    const body = {
      network_id: "1",
      block_number: block,
      transaction_index: 0,
      from: from,
      input: input,
      to: to,
      gas: 800000,
      simulation_type: "quick",
      gas_price: "0",
      value: "0",
      save: true
    };

    const response = await fetch(`${baseUrl}/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // "X-Access-Key": "" // Todo - inject the api key using a CORS proxy
      },
      body: JSON.stringify(body)
    }).then(res => res.json());

    return response;
  }

  async simulateZapIn(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    gasPrice: Integer,
    slippagePercentage: number,
    block: number
  ): Promise<TransactionOutcome> {
    const url = "https://api.zapper.fi/v1/zap-in/yearn/transaction";
    const params = new URLSearchParams({
      ownerAddress: from,
      sellTokenAddress: token,
      sellAmount: amount,
      poolAddress: vault,
      gasPrice: gasPrice,
      slippagePercentage: slippagePercentage.toString(),
      api_key: this.ctx.zapper
    });
    const zapInParams: ZapInOutput = await fetch(`${url}?${params}`).then(res => res.json());

    const body = {
      network_id: "1",
      block_number: block,
      transaction_index: 0,
      from: from,
      input: zapInParams.data,
      to: zapInParams.to,
      gas: zapInParams.gas,
      simulation_type: "quick",
      gas_price: zapInParams.gasPrice,
      value: zapInParams.value,
      save: true
    };

    interface SimulationCallTrace {
      output: string;
    }

    interface SimulationTransactionInfo {
      call_trace: SimulationCallTrace;
    }

    interface SimulationTransaction {
      transaction_info: SimulationTransactionInfo;
    }

    interface SimulationResponse {
      transaction: SimulationTransaction;
    }

    const response: SimulationResponse = await fetch(`${baseUrl}/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(res => res.json());

    const tokensReceived = new BigNumber(response.transaction.transaction_info.call_trace.output);
    const conversionRate = new BigNumber(zapInParams.sellTokenAmount).div(tokensReceived);
    const slippage = 1 - tokensReceived.div(new BigNumber(zapInParams.minTokens)).toNumber();

    const result: TransactionOutcome = {
      sourceTokenAddress: token,
      sourceTokenAmount: amount,
      targetTokenAddress: zapInParams.buyTokenAddress,
      targetTokenAmount: response.transaction.transaction_info.call_trace.output,
      conversionRate: conversionRate.toNumber(),
      slippage: slippage
    };

    return result;
  }
}
