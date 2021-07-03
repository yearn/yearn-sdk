import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";
import BigNumber from "bignumber.js";
import { ChainId } from "../chain";

import { Service } from "../common";
import { Context } from "../context";
import { Address, Integer, SdkError } from "../types";
import { OracleService } from "./oracle";
import { ZapperService } from "./zapper";

const baseUrl = "https://simulate.yearn.network";
const latestBlockKey = -1;
const gasLimit = 8000000;
const VaultAbi = [
  "function deposit(uint256 amount) public",
  "function withdraw(uint256 amount) public",
  "function token() view returns (address)"
];

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

    const response: Response = await makeRequest(`${baseUrl}/fork`, body);
    return response.simulation_fork.id;
  }

  /**
   * Simulate a transaction
   * @param from
   * @param to
   * @param input the encoded input data as per the ethereum abi specification
   * @returns data about the simluated transaction
   */
  async simulateRaw(from: Address, to: Address, input: String): Promise<any> {
    const body = {
      network_id: this.chainId,
      block_number: latestBlockKey,
      transaction_index: 0,
      from: from,
      input: input,
      to: to,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: "0",
      value: "0",
      save: true
    };

    return await makeRequest(`${baseUrl}/simulate`, body);
  }

  async deposit(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    slippage?: number
  ): Promise<TransactionOutcome> {
    const signer = this.ctx.provider.write.getSigner(from);
    const vaultContract = new Contract(vault, VaultAbi, signer);
    const underlyingToken = await vaultContract.token();
    const isZapping = underlyingToken !== getAddress(token);

    if (isZapping) {
      if (slippage === undefined) {
        throw new SdkError("slippage needs to be specified for a zap");
      }
      return zapIn(from, token, amount, vault, slippage, this.chainId, this.ctx);
    } else {
      return directDeposit(from, token, amount, vault, vaultContract, this.chainId);
    }
  }

  async withdraw(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    slippage?: number
  ): Promise<TransactionOutcome> {
    const signer = this.ctx.provider.write.getSigner(from);
    const vaultContract = new Contract(vault, VaultAbi, signer);
    const underlyingToken = await vaultContract.token();
    const isZapping = underlyingToken !== getAddress(token);

    if (isZapping) {
      if (slippage === undefined) {
        throw new SdkError("slippage needs to be specified for a zap");
      }
      return zapOut(from, token, amount, vault, slippage, this.chainId, this.ctx);
    } else {
      return directWithdraw(from, token, amount, vault, vaultContract, this.chainId);
    }
  }

  async approve(from: Address, token: Address, amount: Integer, vault: Address) {
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

    console.log(body);

    // todo
  }
}

async function directDeposit(
  from: Address,
  token: Address,
  amount: Integer,
  vault: Address,
  vaultContract: Contract,
  chainId: ChainId
): Promise<TransactionOutcome> {
  const encodedInputData = vaultContract.interface.encodeFunctionData("deposit", [amount]);

  const body = {
    network_id: chainId.toString(),
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

  const simulationResponse: SimulationResponse = await makeRequest(`${baseUrl}/simulate`, body);
  const tokensReceived = simulationResponse.transaction.transaction_info.call_trace.output;

  const result: TransactionOutcome = {
    sourceTokenAddress: token,
    sourceTokenAmount: amount,
    targetTokenAddress: vault,
    targetTokenAmount: tokensReceived,
    conversionRate: 1,
    slippage: 0
  };

  return result;
}

async function zapIn(
  from: Address,
  token: Address,
  amount: Integer,
  vault: Address,
  slippagePercentage: number,
  chainId: ChainId,
  ctx: Context
): Promise<TransactionOutcome> {
  const zapperService = new ZapperService(chainId, ctx);
  const zapInParams = await zapperService.zapIn(from, token, amount, vault, "0", slippagePercentage);

  const body = {
    network_id: chainId.toString(),
    block_number: latestBlockKey,
    from: from,
    input: zapInParams.data,
    to: zapInParams.to,
    gas: gasLimit,
    simulation_type: "quick",
    gas_price: "0",
    value: zapInParams.value,
    save: true
  };

  const simulationResponse: SimulationResponse = await makeRequest(`${baseUrl}/simulate`, body);
  const tokensReceived = simulationResponse.transaction.transaction_info.call_trace.output;

  const oracle = new OracleService(chainId, ctx);

  const zapInAmountUsdc = await oracle.getNormalizedValueUsdc(token, tokensReceived);
  const boughtAssetAmountUsdc = await oracle.getNormalizedValueUsdc(vault, amount);

  const conversionRate = new BigNumber(boughtAssetAmountUsdc).div(new BigNumber(zapInAmountUsdc)).toNumber();
  const slippage = 1 - conversionRate;

  const result: TransactionOutcome = {
    sourceTokenAddress: token,
    sourceTokenAmount: amount,
    targetTokenAddress: zapInParams.buyTokenAddress,
    targetTokenAmount: tokensReceived,
    conversionRate: conversionRate,
    slippage: slippage
  };

  return result;
}

async function directWithdraw(
  from: Address,
  token: Address,
  amount: Integer,
  vault: Address,
  vaultContract: Contract,
  chainId: ChainId
): Promise<TransactionOutcome> {
  const encodedInputData = vaultContract.interface.encodeFunctionData("withdraw", [amount]);

  const body = {
    network_id: chainId.toString(),
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

  const simulationResponse: SimulationResponse = await makeRequest(`${baseUrl}/simulate`, body);
  const output = simulationResponse.transaction.transaction_info.call_trace.calls[0].output;

  let result: TransactionOutcome = {
    sourceTokenAddress: vault,
    sourceTokenAmount: amount,
    targetTokenAddress: token,
    targetTokenAmount: output,
    conversionRate: 1,
    slippage: 0
  };

  return result;
}

async function zapOut(
  from: Address,
  token: Address,
  amount: Integer,
  vault: Address,
  slippagePercentage: number,
  chainId: ChainId,
  ctx: Context
): Promise<TransactionOutcome> {
  const zapper = new ZapperService(chainId, ctx);
  const zapOutParams = await zapper.zapOut(from, token, amount, vault, "0", slippagePercentage);

  const body = {
    network_id: chainId.toString(),
    block_number: latestBlockKey,
    from: zapOutParams.from,
    input: zapOutParams.data,
    to: zapOutParams.to,
    gas: gasLimit,
    simulation_type: "quick",
    gas_price: "0",
    value: "0",
    save: true
  };

  const simulationResponse: SimulationResponse = await makeRequest(`${baseUrl}/simulate`, body);
  const output = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.output).toFixed(0);

  const oracle = new OracleService(chainId, ctx);

  const zapOutAmountUsdc = await oracle.getNormalizedValueUsdc(token, output);
  const soldAssetAmountUsdc = await oracle.getNormalizedValueUsdc(vault, amount);

  const conversionRate = new BigNumber(zapOutAmountUsdc).div(new BigNumber(soldAssetAmountUsdc)).toNumber();
  const slippage = 1 - conversionRate;

  let result: TransactionOutcome = {
    sourceTokenAddress: vault,
    sourceTokenAmount: amount,
    targetTokenAddress: token,
    targetTokenAmount: output,
    conversionRate: conversionRate,
    slippage: slippage
  };

  return result;
}

async function makeRequest(path: string, body: any): Promise<any> {
  return await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  }).then(res => res.json());
}
