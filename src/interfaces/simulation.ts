import { defaultAbiCoder } from "@ethersproject/abi";
import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress, WethAddress, ZeroAddress } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import { Address, Integer, SdkError, ZapApprovalTransactionOutput, ZapProtocol } from "../types";
import { TransactionOutcome } from "../types/custom/simulation";
import { PickleJarContract, VaultContract, YearnVaultContract } from "../vault";

const baseUrl = "https://simulate.yearn.network";
const latestBlockKey = -1;
const gasLimit = 8000000;

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
    sellToken: Address,
    amount: Integer,
    toVault: Address,
    slippage?: number
  ): Promise<TransactionOutcome> {
    const signer = this.ctx.provider.write.getSigner(from);
    const zapProtocol = PickleJars.includes(toVault) ? ZapProtocol.PICKLE : ZapProtocol.YEARN;
    let vaultContract =
      zapProtocol === ZapProtocol.PICKLE
        ? new PickleJarContract(toVault, signer)
        : new YearnVaultContract(toVault, signer);

    const underlyingToken = await vaultContract.token();
    const isZapping = underlyingToken !== sellToken;

    if (isZapping) {
      if (!slippage) {
        throw new SdkError("slippage needs to be specified for a zap");
      }

      let needsApproving: boolean;

      if (sellToken === EthAddress) {
        needsApproving = false;
      } else {
        needsApproving = await this.yearn.services.zapper
          .zapInApprovalState(from, sellToken, zapProtocol)
          .then(state => !state.isApproved);
      }

      if (needsApproving) {
        const approvalTransaction = await this.yearn.services.zapper.zapInApprovalTransaction(
          from,
          sellToken,
          "0",
          zapProtocol
        );

        const forkId = await this.createFork();
        const approvalSimulationResponse = await this.simulateZapApprovalTransaction(approvalTransaction, forkId);
        return this.zapIn(
          from,
          sellToken,
          underlyingToken,
          amount,
          toVault,
          vaultContract,
          slippage,
          zapProtocol,
          approvalSimulationResponse.simulation.id,
          forkId
        ).finally(async () => {
          await this.deleteFork(forkId);
        });
      } else {
        return this.zapIn(from, sellToken, underlyingToken, amount, toVault, vaultContract, slippage, zapProtocol);
      }
    } else {
      const needsApproving = await this.depositNeedsApproving(from, sellToken, toVault, amount, signer);
      if (needsApproving) {
        const forkId = await this.createFork();
        const approvalTransactionId = await this.approve(from, sellToken, amount, toVault, forkId);
        return this.directDeposit(
          from,
          sellToken,
          amount,
          toVault,
          vaultContract,
          approvalTransactionId,
          forkId
        ).finally(async () => {
          await this.deleteFork(forkId);
        });
      } else {
        return this.directDeposit(from, sellToken, amount, toVault, vaultContract);
      }
    }
  }

  async withdraw(
    from: Address,
    fromVault: Address,
    amount: Integer,
    toToken: Address,
    slippage?: number
  ): Promise<TransactionOutcome> {
    const signer = this.ctx.provider.write.getSigner(from);
    const vaultContract = new YearnVaultContract(fromVault, signer);
    const underlyingToken = await vaultContract.token();
    const isZapping = underlyingToken !== getAddress(toToken);

    if (isZapping) {
      if (!slippage) {
        throw new SdkError("slippage needs to be specified for a zap");
      }
      let needsApproving: boolean;

      if (fromVault === EthAddress) {
        needsApproving = false;
      } else {
        needsApproving = await this.yearn.services.zapper
          .zapOutApprovalState(from, fromVault)
          .then(state => !state.isApproved);
      }

      if (needsApproving) {
        const approvalTransaction = await this.yearn.services.zapper.zapOutApprovalTransaction(from, fromVault, "0");
        const forkId = await this.createFork();
        const approvalSimulationResponse = await this.simulateZapApprovalTransaction(approvalTransaction, forkId);
        return this.zapOut(
          from,
          toToken,
          underlyingToken,
          amount,
          fromVault,
          vaultContract,
          slippage,
          approvalSimulationResponse.simulation.id,
          forkId
        ).finally(async () => {
          await this.deleteFork(forkId);
        });
      } else {
        return this.zapOut(from, toToken, underlyingToken, amount, fromVault, vaultContract, slippage);
      }
    } else {
      return this.directWithdraw(from, toToken, amount, fromVault, vaultContract);
    }
  }

  async approve(from: Address, token: Address, amount: Integer, vault: Address, forkId: string): Promise<string> {
    const TokenAbi = ["function approve(address spender, uint256 amount) returns (bool)"];
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
    const TokenAbi = ["function allowance(address owner, address spender) view returns (uint256)"];
    const contract = new Contract(token, TokenAbi, signer);
    const result = await contract.allowance(from, vault);
    return new BigNumber(result.toString()).lt(new BigNumber(amount));
  }

  private async directDeposit(
    from: Address,
    sellToken: Address,
    amount: Integer,
    toVault: Address,
    vaultContract: VaultContract,
    root?: string,
    forkId?: string
  ): Promise<TransactionOutcome> {
    const encodedInputData = vaultContract.encodeDeposit(amount);

    const body = {
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      from: from,
      input: encodedInputData,
      to: toVault,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: "0",
      value: "0",
      save: true,
      root: root
    };

    const simulationResponse: SimulationResponse = await this.makeSimulationRequest(body, forkId);
    const output = simulationResponse.transaction.transaction_info.call_trace.output;

    const tokensReceived = defaultAbiCoder.decode(["uint256"], output)[0].toString();
    const targetTokenAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(toVault, tokensReceived);

    const result: TransactionOutcome = {
      sourceTokenAddress: sellToken,
      sourceTokenAmount: amount,
      targetTokenAddress: toVault,
      targetTokenAmount: tokensReceived,
      targetTokenAmountUsdc: targetTokenAmountUsdc,
      targetUnderlyingTokenAddress: toVault,
      targetUnderlyingTokenAmount: tokensReceived,
      conversionRate: 1,
      slippage: 0
    };

    return result;
  }

  private async zapIn(
    from: Address,
    sellToken: Address,
    underlyingTokenAddress: Address,
    amount: Integer,
    toVault: Address,
    vaultContract: VaultContract,
    slippage: number,
    zapProtocol: ZapProtocol,
    root?: string,
    forkId?: string
  ): Promise<TransactionOutcome> {
    const zapToken = sellToken === EthAddress ? ZeroAddress : sellToken;
    const zapInParams = await this.yearn.services.zapper.zapIn(
      from,
      zapToken,
      amount,
      toVault,
      "0",
      slippage,
      zapProtocol
    );
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

    const decimals = await vaultContract.decimals();
    const simulationResponse: SimulationResponse = await this.makeSimulationRequest(body, forkId);
    const assetTokensReceived = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.output);
    const pricePerShare = await vaultContract.pricePerShare();
    const targetUnderlyingTokensReceived = assetTokensReceived
      .div(new BigNumber(10).pow(decimals))
      .multipliedBy(pricePerShare)
      .toFixed(0);

    const amountReceived = assetTokensReceived.toFixed(0);

    let amountReceivedUsdc: BigNumber;

    switch (zapProtocol) {
      case ZapProtocol.YEARN:
        amountReceivedUsdc = await this.yearn.services.oracle
          .getNormalizedValueUsdc(toVault, amountReceived)
          .then(price => new BigNumber(price));
        break;
      case ZapProtocol.PICKLE:
        amountReceivedUsdc = (await this.yearn.services.pickle.getPriceUsdc(toVault).then(usdc => new BigNumber(usdc)))
          .dividedBy(new BigNumber(10).pow(decimals))
          .multipliedBy(new BigNumber(amountReceived));
        break;
    }

    const oracleToken = sellToken === EthAddress ? WethAddress : sellToken;
    const zapInAmountUsdc = new BigNumber(await this.yearn.services.oracle.getNormalizedValueUsdc(oracleToken, amount));

    const conversionRate = amountReceivedUsdc.div(new BigNumber(zapInAmountUsdc)).toNumber();

    const result: TransactionOutcome = {
      sourceTokenAddress: sellToken,
      sourceTokenAmount: amount,
      targetTokenAddress: zapInParams.buyTokenAddress,
      targetTokenAmount: amountReceived,
      targetTokenAmountUsdc: amountReceivedUsdc.toFixed(0),
      targetUnderlyingTokenAddress: underlyingTokenAddress,
      targetUnderlyingTokenAmount: targetUnderlyingTokensReceived,
      conversionRate: conversionRate,
      slippage: 1 - conversionRate
    };

    return result;
  }

  private async directWithdraw(
    from: Address,
    toToken: Address,
    amount: Integer,
    fromVault: Address,
    vaultContract: VaultContract
  ): Promise<TransactionOutcome> {
    const encodedInputData = vaultContract.encodeWithdraw(amount);

    const body = {
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      from: from,
      input: encodedInputData,
      to: fromVault,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: "0",
      value: "0",
      save: true
    };

    const simulationResponse: SimulationResponse = await this.makeSimulationRequest(body);
    const output = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.calls[0].output).toFixed(0);
    const targetTokenAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(toToken, output);

    let result: TransactionOutcome = {
      sourceTokenAddress: fromVault,
      sourceTokenAmount: amount,
      targetTokenAddress: toToken,
      targetTokenAmount: output,
      targetTokenAmountUsdc: targetTokenAmountUsdc,
      targetUnderlyingTokenAddress: toToken,
      targetUnderlyingTokenAmount: output,
      conversionRate: 1,
      slippage: 0
    };

    return result;
  }

  private async zapOut(
    from: Address,
    toToken: Address,
    underlyingTokenAddress: Address,
    amount: Integer,
    fromVault: Address,
    vaultContract: VaultContract,
    slippage: number,
    root?: string,
    forkId?: string
  ): Promise<TransactionOutcome> {
    const zapToken = toToken === EthAddress ? ZeroAddress : toToken;
    const zapOutParams = await this.yearn.services.zapper.zapOut(from, zapToken, amount, fromVault, "0", slippage);

    const body = {
      network_id: this.chainId.toString(),
      block_number: latestBlockKey,
      from: from,
      input: zapOutParams.data,
      to: zapOutParams.to,
      gas: gasLimit,
      simulation_type: "quick",
      gas_price: "0",
      value: zapOutParams.value,
      save: true,
      root: root
    };

    const simulationResponse: SimulationResponse = await this.makeSimulationRequest(body, forkId);

    const output = new BigNumber(simulationResponse.transaction.transaction_info.call_trace.output).toFixed(0);

    const pricePerShare = await vaultContract.pricePerShare();
    const decimals = await vaultContract.decimals();
    const targetUnderlyingTokensReceived = new BigNumber(amount)
      .times(new BigNumber(pricePerShare.toString()))
      .div(new BigNumber(10).pow(decimals))
      .toFixed(0);

    const oracleToken = toToken === EthAddress ? WethAddress : toToken;
    const zapOutAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(oracleToken, output);
    const soldAssetAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(fromVault, amount);

    const conversionRate = new BigNumber(zapOutAmountUsdc).div(new BigNumber(soldAssetAmountUsdc)).toNumber();

    let result: TransactionOutcome = {
      sourceTokenAddress: fromVault,
      sourceTokenAmount: amount,
      targetTokenAddress: toToken,
      targetTokenAmount: output,
      targetTokenAmountUsdc: zapOutAmountUsdc,
      targetUnderlyingTokenAddress: underlyingTokenAddress,
      targetUnderlyingTokenAmount: targetUnderlyingTokensReceived,
      conversionRate: conversionRate,
      slippage: 1 - conversionRate
    };

    return result;
  }

  private async simulateZapApprovalTransaction(
    zapApprovalTransaction: ZapApprovalTransactionOutput,
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
    const constructedPath = forkId ? `${baseUrl}/fork/${forkId}/simulate` : `${baseUrl}/simulate`;
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
