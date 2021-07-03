import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";
import BigNumber from "bignumber.js";

import { Service } from "../common";
import { Address, Integer } from "../types";
import { ZapperService } from "./zapper";

const baseUrl = "https://simulate.yearn.network";
const latestBlockKey = -1;
const gasLimit = 8000000;

interface TransactionOutcome {
  sourceTokenAddress: Address;
  sourceTokenAmount: Integer;
  targetTokenAddress: Address;
  targetTokenAmount: Integer;
  conversionRate: number;
  slippage: number;
}

interface SimulationCallTrace {
  output: Integer;
  calls: SimulationCallTrace[];
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

/**
 * [[SimulationService]] allows the simulation of ethereum transactions using Tenderly's api.
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

    const response: Response = await this.makeRequest(`${baseUrl}/fork`, body);
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
      network_id: this.chainId,
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

    return await this.makeRequest(`${baseUrl}/simulate`, body);
  }

  /**
   * Simulate a Zap In transaction
   * @param from the address initiating the zap
   * @param token the token
   * @param to the token to be sold
   * @param amount the amount of tokens to be sold
   * @param vault the vault being zapped into
   * @param gasPrice
   * @param slippagePercentage
   * @param block
   * @returns the result of the transaction
   */
  async zapIn(
    // todo - move this logic into deposit
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    gasPrice: Integer,
    slippagePercentage: number
  ): Promise<TransactionOutcome> {
    const zapperService = new ZapperService(this.chainId, this.ctx);
    const zapInParams = await zapperService.zapIn(from, token, amount, vault, gasPrice, slippagePercentage);

    const body = {
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      from: from,
      input: zapInParams.data,
      to: zapInParams.to,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: zapInParams.gasPrice,
      value: zapInParams.value,
      save: true
    };

    const simulationResponse: SimulationResponse = await this.makeRequest(`${baseUrl}/simulate`, body);
    const tokensReceived = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.output);
    const conversionRate = new BigNumber(zapInParams.sellTokenAmount).div(tokensReceived);
    const slippage = 0; // todo

    const result: TransactionOutcome = {
      sourceTokenAddress: token,
      sourceTokenAmount: amount,
      targetTokenAddress: zapInParams.buyTokenAddress,
      targetTokenAmount: simulationResponse.transaction.transaction_info.call_trace.output,
      conversionRate: conversionRate.toNumber(),
      slippage: slippage
    };

    return result;
  }

  async deposit(from: Address, token: Address, amount: Integer, vault: Address): Promise<TransactionOutcome> {
    const VaultAbi = ["function deposit(uint256 amount) public"];
    const signer = this.ctx.provider.write.getSigner(from);
    const vaultContract = new Contract(vault, VaultAbi, signer);
    const encodedInputData = vaultContract.interface.encodeFunctionData("deposit", [amount]);

    const body = {
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      from: from,
      input: encodedInputData,
      to: vault,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: "0",
      value: "0",
      save: true
    };

    const simulationResponse: SimulationResponse = await this.makeRequest(`${baseUrl}/simulate`, body);
    const tokensReceived = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.output);
    const conversionRate = new BigNumber(amount).div(tokensReceived);
    const slippage = 1 - tokensReceived.div(new BigNumber(amount)).toNumber();

    const result: TransactionOutcome = {
      sourceTokenAddress: token,
      sourceTokenAmount: amount,
      targetTokenAddress: vault,
      targetTokenAmount: simulationResponse.transaction.transaction_info.call_trace.output,
      conversionRate: conversionRate.toNumber(),
      slippage: slippage
    };

    return result;
  }

  async approve(from: Address, token: Address, amount: Integer, vault: Address): Promise<TransactionOutcome> {
    const TokenAbi = ["function approve(address spender,uint256 amount) bool"];
    const signer = this.ctx.provider.write.getSigner(from);
    const tokenContract = new Contract(token, TokenAbi, signer);
    const encodedInputData = tokenContract.interface.encodeFunctionData("approve", [vault, amount]);

    const body = {
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      from: from,
      input: encodedInputData,
      to: token,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: "0",
      value: "0",
      save: true
    };

    const simulationResponse: SimulationResponse = await this.makeRequest(`${baseUrl}/simulate`, body);
    const tokensReceived = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.output);
    const conversionRate = new BigNumber(amount).div(tokensReceived);
    const slippage = 1 - tokensReceived.div(new BigNumber(amount)).toNumber();

    const result: TransactionOutcome = {
      sourceTokenAddress: token,
      sourceTokenAmount: amount,
      targetTokenAddress: vault,
      targetTokenAmount: simulationResponse.transaction.transaction_info.call_trace.output,
      conversionRate: conversionRate.toNumber(),
      slippage: slippage
    };

    return result;
  }

  async withdraw(from: Address, token: Address, amount: Integer, vault: Address): Promise<TransactionOutcome> {
    const VaultAbi = ["function withdraw(uint256 amount) public", "function token() view returns (address)"];
    const signer = this.ctx.provider.write.getSigner(from);
    const vaultContract = new Contract(vault, VaultAbi, signer);
    const underlyingToken = await vaultContract.token();
    const isZapping = underlyingToken === getAddress(token);

    const getEncodedInputData = async () => {
      if (isZapping) {
        const zapper = new ZapperService(this.chainId, this.ctx);
        return await zapper.zapOut(from, token, amount, vault, "0", 0.03).then(params => params.data);
      } else {
        return vaultContract.interface.encodeFunctionData("withdraw", [amount]);
      }
    };

    const encodedInputData = await getEncodedInputData();

    const body = {
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      from: from,
      input: encodedInputData,
      to: vault,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: "0",
      value: "0",
      save: true
    };

    const simulationResponse: SimulationResponse = await this.makeRequest(`${baseUrl}/simulate`, body);

    if (isZapping) {
      const output = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.output).toFixed(0);
      const conversionRate = new BigNumber(output).div(new BigNumber(amount)).toNumber();
      const slippage = 0; // todo

      let result: TransactionOutcome = {
        sourceTokenAddress: vault,
        sourceTokenAmount: amount,
        targetTokenAddress: token,
        targetTokenAmount: output,
        conversionRate: conversionRate,
        slippage: slippage
      };

      return result;
    } else {
      const output = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.calls[0].output);
      const conversionRate = new BigNumber(output).div(new BigNumber(amount)).toNumber();
      const slippage = isZapping ? 0 : Math.abs(1 - conversionRate);

      let result: TransactionOutcome = {
        sourceTokenAddress: vault,
        sourceTokenAmount: amount,
        targetTokenAddress: token,
        targetTokenAmount: output.toFixed(0),
        conversionRate: conversionRate,
        slippage: slippage
      };

      return result;
    }
  }

  async makeRequest(path: string, body: any): Promise<any> {
    return await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(res => res.json());
  }
}
