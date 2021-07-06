import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress, WethAddress, ZeroAddress } from "../helpers";
import { Address, Integer, SdkError, ZapInApprovalTransactionOutput } from "../types";
import { TransactionOutcome } from "../types/custom/simulation";

const baseUrl = "https://simulate.yearn.network";
const latestBlockKey = -1;
const gasLimit = 8000000;
const VaultAbi = [
  "function deposit(uint256 amount) public",
  "function withdraw(uint256 amount) public",
  "function token() view returns (address)",
  "function pricePerShare() view returns (uint256)"
];

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

interface Simulation {
  id: string;
}

interface SimulationResponse {
  transaction: SimulationTransaction;
  simulation: Simulation;
}

/**
 * [[SimulationInterface]] allows the simulation of ethereum transactions using Tenderly's api.
 * This allows us to know information before executing a transaction on mainnet.
 * For example it can simulate how much slippage is likely to be experienced when withdrawing from a vault,
 * or how many underlying tokens the user will receive upon withdrawing share tokens.
 */
export class SimulationInterface<T extends ChainId> extends ServiceInterface<T> {
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

    return await this.makeSimulationRequest(body);
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

      let needsApproving: boolean;

      if (token === EthAddress) {
        needsApproving = false;
      } else {
        needsApproving = await this.yearn.services.zapper
          .zapInApprovalState(from, token)
          .then(state => !state.isApproved);
      }

      if (needsApproving) {
        const approvalTransaction = await this.yearn.services.zapper.zapInApprovalTransaction(from, token, "0");
        const forkId = await this.createFork();
        const approvalSimulationResponse = await this.simulateZapApprovalTransaction(approvalTransaction, forkId);
        try {
          return this.zapIn(
            from,
            token,
            underlyingToken,
            amount,
            vault,
            vaultContract,
            slippage,
            approvalSimulationResponse.simulation.id,
            forkId
          );
        } finally {
          await this.deleteFork(forkId);
        }
      } else {
        return this.zapIn(from, token, underlyingToken, amount, vault, vaultContract, slippage);
      }
    } else {
      const needsApproving = await this.depositNeedsApproving(from, token, vault, amount, signer);
      if (needsApproving) {
        const forkId = await this.createFork();
        const approvalTransactionId = await this.approve(from, token, amount, vault, forkId);
        try {
          return this.directDeposit(from, token, amount, vault, vaultContract, approvalTransactionId, forkId);
        } finally {
          await this.deleteFork(forkId);
        }
      } else {
        return this.directDeposit(from, token, amount, vault, vaultContract);
      }
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
      return this.zapOut(from, token, underlyingToken, amount, vault, vaultContract, slippage);
    } else {
      return this.directWithdraw(from, token, amount, vault, vaultContract);
    }
  }

  async approve(from: Address, token: Address, amount: Integer, vault: Address, forkId: string): Promise<string> {
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

    const simulationResponse: SimulationResponse = await this.makeSimulationRequest(body, forkId);
    return simulationResponse.simulation.id;
  }

  private async depositNeedsApproving(
    from: Address,
    token: Address,
    vault: Address,
    amount: Integer,
    signer: JsonRpcSigner
  ): Promise<boolean> {
    const TokenAbi = ["function allowance(address owner,address spender) view returns (uint256)"];
    const contract = new Contract(token, TokenAbi, signer);
    const result = await contract.allowance(from, vault);
    return new BigNumber(result.toString()).lt(new BigNumber(amount));
  }

  private async directDeposit(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    vaultContract: Contract,
    root?: string,
    forkId?: string
  ): Promise<TransactionOutcome> {
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
      save: true,
      root: root
    };

    const simulationResponse: SimulationResponse = await this.makeSimulationRequest(body, forkId);
    const tokensReceived = simulationResponse.transaction.transaction_info.call_trace.output;

    const result: TransactionOutcome = {
      sourceTokenAddress: token,
      sourceTokenAmount: amount,
      targetTokenAddress: vault,
      targetTokenAmount: tokensReceived
    };

    return result;
  }

  private async zapIn(
    from: Address,
    token: Address,
    underlyingTokenAddress: Address,
    amount: Integer,
    vault: Address,
    vaultContract: Contract,
    slippage: number,
    root?: string,
    forkId?: string
  ): Promise<TransactionOutcome> {
    const zapToken = token === EthAddress ? ZeroAddress : token;
    const zapInParams = await this.yearn.services.zapper.zapIn(from, zapToken, amount, vault, "0", slippage);
    const value = new BigNumber(zapInParams.value).toFixed(0);

    const body = {
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      from: from,
      input: zapInParams.data,
      to: zapInParams.to,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: "0",
      value: value,
      save: true,
      root: root
    };

    const simulationResponse: SimulationResponse = await this.makeSimulationRequest(body, forkId);
    const assetTokensReceived = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.output);
    const pricePerShare = await vaultContract.pricePerShare();
    const targetUnderlyingTokensReceived = assetTokensReceived
      .times(new BigNumber(pricePerShare.toString()))
      .div(new BigNumber(10).pow(18))
      .toFixed(0);

    const oracleToken = token === EthAddress ? WethAddress : token;
    const zapInAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(oracleToken, amount);

    const amountReceived = assetTokensReceived.toFixed(0);
    const boughtAssetAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(vault, amountReceived);

    const conversionRate = new BigNumber(boughtAssetAmountUsdc).div(new BigNumber(zapInAmountUsdc)).toNumber();

    const result: TransactionOutcome = {
      sourceTokenAddress: token,
      sourceTokenAmount: amount,
      targetTokenAddress: zapInParams.buyTokenAddress,
      targetTokenAmount: amountReceived,
      targetUnderlyingTokenAddress: underlyingTokenAddress,
      targetUnderlyingTokenAmount: targetUnderlyingTokensReceived,
      conversionRate: conversionRate,
      slippage: 1 - conversionRate
    };

    return result;
  }

  private async directWithdraw(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    vaultContract: Contract
  ): Promise<TransactionOutcome> {
    const encodedInputData = vaultContract.interface.encodeFunctionData("withdraw", [amount]);

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

    const simulationResponse: SimulationResponse = await this.makeSimulationRequest(body);
    const output = simulationResponse.transaction.transaction_info.call_trace.calls[0].output;

    let result: TransactionOutcome = {
      sourceTokenAddress: vault,
      sourceTokenAmount: amount,
      targetTokenAddress: token,
      targetTokenAmount: output
    };

    return result;
  }

  private async zapOut(
    from: Address,
    token: Address,
    underlyingTokenAddress: Address,
    amount: Integer,
    vault: Address,
    vaultContract: Contract,
    slippage: number
  ): Promise<TransactionOutcome> {
    const zapToken = token === EthAddress ? ZeroAddress : token;
    const zapOutParams = await this.yearn.services.zapper.zapOut(from, zapToken, amount, vault, "0", slippage);

    const body = {
      network_id: this.chainId.toString(),
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

    const simulationResponse: SimulationResponse = await this.makeSimulationRequest(body);
    const output = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.output).toFixed(0);
    const pricePerShare = await vaultContract.pricePerShare();
    const targetUnderlyingTokensReceived = new BigNumber(amount)
      .times(new BigNumber(pricePerShare.toString()))
      .div(new BigNumber(10).pow(18))
      .toFixed(0);

    const oracleToken = token === EthAddress ? WethAddress : token;
    const zapOutAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(oracleToken, output);
    const soldAssetAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(vault, amount);

    const conversionRate = new BigNumber(zapOutAmountUsdc).div(new BigNumber(soldAssetAmountUsdc)).toNumber();

    let result: TransactionOutcome = {
      sourceTokenAddress: vault,
      sourceTokenAmount: amount,
      targetTokenAddress: token,
      targetTokenAmount: output,
      targetUnderlyingTokenAddress: underlyingTokenAddress,
      targetUnderlyingTokenAmount: targetUnderlyingTokensReceived,
      conversionRate: conversionRate,
      slippage: 1 - conversionRate
    };

    return result;
  }

  private async simulateZapApprovalTransaction(
    zapApprovalTransaction: ZapInApprovalTransactionOutput,
    forkId?: string
  ): Promise<SimulationResponse> {
    const body = {
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      from: zapApprovalTransaction.from,
      input: zapApprovalTransaction.data,
      to: zapApprovalTransaction.to,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: "0",
      value: "0",
      save: true
    };

    const response: SimulationResponse = await this.makeSimulationRequest(body, forkId);
    return response;
  }

  /**
   * Create a new fork that can be used to simulate multiple sequential transactions on
   * e.g. approval followed by a deposit.
   * @returns the uuid of a new fork that has been created
   */
  private async createFork(): Promise<string> {
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

  private async makeSimulationRequest(body: any, forkId?: string): Promise<any> {
    const constructedPath = forkId === undefined ? `${baseUrl}/simulate` : `${baseUrl}/fork/${forkId}/simulate`;
    return await fetch(constructedPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(res => res.json());
  }

  private async deleteFork(forkId: string): Promise<any> {
    return await fetch(`${baseUrl}/fork/${forkId}`, { method: "DELETE" });
  }
}
