import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress, WethAddress, ZeroAddress } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import { SimulationExecutor, SimulationRequestBody, SimulationResponse } from "../simulationExecutor";
import { Address, Integer, SdkError, ZapApprovalTransactionOutput, ZapProtocol } from "../types";
import { TransactionOutcome } from "../types/custom/simulation";
import { PickleJarContract, VaultContract, YearnVaultContract } from "../vault";

/**
 * [[SimulationInterface]] allows the simulation of ethereum transactions using Tenderly's api.
 * This allows us to know information before executing a transaction on mainnet.
 * For example it can simulate how much slippage is likely to be experienced when withdrawing from a vault,
 * or how many underlying tokens the user will receive upon withdrawing share tokens.
 */
export class SimulationInterface<T extends ChainId> extends ServiceInterface<T> {
  simulationExecutor = new SimulationExecutor(this.chainId, this.yearn.services.telegram);

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
    let forkId: string | undefined;
    let simulateDeposit: (save: boolean) => Promise<TransactionOutcome>;

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

      forkId = needsApproving ? await this.simulationExecutor.createFork() : undefined;
      const approvalTransactionId = needsApproving
        ? await this.yearn.services.zapper
            .zapInApprovalTransaction(from, sellToken, "0", zapProtocol)
            .then(async approvalTransaction => {
              return await this.simulateZapApprovalTransaction(approvalTransaction, forkId);
            })
            .then(res => res.simulation.id)
        : undefined;

      simulateDeposit = (save: boolean) =>
        this.zapIn(
          from,
          sellToken,
          underlyingToken,
          amount,
          toVault,
          vaultContract,
          slippage,
          zapProtocol,
          save,
          approvalTransactionId,
          forkId
        );
    } else {
      const needsApproving = await this.depositNeedsApproving(from, sellToken, toVault, amount, signer);
      forkId = needsApproving ? await this.simulationExecutor.createFork() : undefined;
      const approvalTransactionId = needsApproving
        ? await this.approve(from, sellToken, amount, toVault, forkId)
        : undefined;

      simulateDeposit = (save: boolean) =>
        this.directDeposit(from, sellToken, amount, toVault, vaultContract, save, approvalTransactionId, forkId);
    }
    return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateDeposit, forkId);
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
    let forkId: string | undefined;
    let simulateWithdrawal: (save: boolean) => Promise<TransactionOutcome>;

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

      forkId = needsApproving ? await this.simulationExecutor.createFork() : undefined;
      const approvalSimulationId = needsApproving
        ? await this.yearn.services.zapper
            .zapOutApprovalTransaction(from, fromVault, "0")
            .then(async approvalTransaction => {
              return await this.simulateZapApprovalTransaction(approvalTransaction, forkId);
            })
            .then(res => res.simulation.id)
        : undefined;

      simulateWithdrawal = (save: boolean) =>
        this.zapOut(
          from,
          toToken,
          underlyingToken,
          amount,
          fromVault,
          vaultContract,
          slippage,
          save,
          approvalSimulationId,
          forkId
        );
    } else {
      simulateWithdrawal = (save: boolean) =>
        this.directWithdraw(from, toToken, amount, fromVault, vaultContract, save);
    }
    return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateWithdrawal, forkId);
  }

  private async approve(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    forkId?: string
  ): Promise<string> {
    const TokenAbi = ["function approve(address spender, uint256 amount) returns (bool)"];
    const signer = this.ctx.provider.write.getSigner(from);
    const tokenContract = new Contract(token, TokenAbi, signer);
    const encodedInputData = tokenContract.interface.encodeFunctionData("approve", [vault, amount]);

    const body = {
      from: from,
      input: encodedInputData,
      to: token,
      save: true
    };

    const simulationResponse: SimulationResponse = await this.simulationExecutor.makeSimulationRequest(body, forkId);
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
    save: boolean,
    root?: string,
    forkId?: string
  ): Promise<TransactionOutcome> {
    const encodedInputData = vaultContract.encodeDeposit(amount);

    const body: SimulationRequestBody = {
      from: from,
      input: encodedInputData,
      to: toVault,
      root: root,
      save: save
    };

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(body, toVault, from, forkId);
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
    save: boolean,
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
      from: from,
      input: zapInParams.data,
      to: zapInParams.to,
      save: save,
      value: value,
      root: root
    };

    const decimals = await vaultContract.decimals();
    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(body, toVault, from, forkId);
    const pricePerShare = await vaultContract.pricePerShare();
    const targetUnderlyingTokensReceived = new BigNumber(tokensReceived)
      .div(new BigNumber(10).pow(decimals))
      .multipliedBy(pricePerShare)
      .toFixed(0);

    let amountReceivedUsdc: BigNumber;

    switch (zapProtocol) {
      case ZapProtocol.YEARN:
        amountReceivedUsdc = await this.yearn.services.oracle
          .getNormalizedValueUsdc(toVault, tokensReceived)
          .then(price => new BigNumber(price));
        break;
      case ZapProtocol.PICKLE:
        amountReceivedUsdc = (await this.yearn.services.pickle.getPriceUsdc(toVault).then(usdc => new BigNumber(usdc)))
          .dividedBy(new BigNumber(10).pow(decimals))
          .multipliedBy(new BigNumber(tokensReceived));
        break;
    }

    const oracleToken = sellToken === EthAddress ? WethAddress : sellToken;
    const zapInAmountUsdc = new BigNumber(await this.yearn.services.oracle.getNormalizedValueUsdc(oracleToken, amount));

    const conversionRate = amountReceivedUsdc.div(new BigNumber(zapInAmountUsdc)).toNumber();

    const result: TransactionOutcome = {
      sourceTokenAddress: sellToken,
      sourceTokenAmount: amount,
      targetTokenAddress: zapInParams.buyTokenAddress,
      targetTokenAmount: tokensReceived,
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
    vaultContract: VaultContract,
    save: boolean
  ): Promise<TransactionOutcome> {
    const encodedInputData = vaultContract.encodeWithdraw(amount);

    const body = {
      from: from,
      input: encodedInputData,
      to: fromVault,
      save: save
    };

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(body, toToken, from);
    const targetTokenAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(toToken, tokensReceived);

    let result: TransactionOutcome = {
      sourceTokenAddress: fromVault,
      sourceTokenAmount: amount,
      targetTokenAddress: toToken,
      targetTokenAmount: tokensReceived,
      targetTokenAmountUsdc: targetTokenAmountUsdc,
      targetUnderlyingTokenAddress: toToken,
      targetUnderlyingTokenAmount: tokensReceived,
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
    save: boolean,
    root?: string,
    forkId?: string
  ): Promise<TransactionOutcome> {
    const zapToken = toToken === EthAddress ? ZeroAddress : toToken;
    const zapOutParams = await this.yearn.services.zapper.zapOut(from, zapToken, amount, fromVault, "0", slippage);

    const body: SimulationRequestBody = {
      from: from,
      input: zapOutParams.data,
      to: zapOutParams.to,
      save: save,
      value: zapOutParams.value,
      root: root
    };

    const tokensReceived = await (async () => {
      if (zapToken === ZeroAddress) {
        let response: SimulationResponse = await this.simulationExecutor.makeSimulationRequest(body, forkId);
        return new BigNumber(response.transaction.transaction_info.call_trace.output).toFixed(0);
      } else {
        return await this.simulationExecutor.simulateVaultInteraction(body, toToken, from, forkId);
      }
    })();

    const pricePerShare = await vaultContract.pricePerShare();
    const decimals = await vaultContract.decimals();
    const targetUnderlyingTokensReceived = new BigNumber(amount)
      .times(new BigNumber(pricePerShare.toString()))
      .div(new BigNumber(10).pow(decimals))
      .toFixed(0);

    const oracleToken = toToken === EthAddress ? WethAddress : toToken;
    const zapOutAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(oracleToken, tokensReceived);
    const soldAssetAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(fromVault, amount);

    const conversionRate = new BigNumber(zapOutAmountUsdc).div(new BigNumber(soldAssetAmountUsdc)).toNumber();

    let result: TransactionOutcome = {
      sourceTokenAddress: fromVault,
      sourceTokenAmount: amount,
      targetTokenAddress: toToken,
      targetTokenAmount: tokensReceived,
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
      from: zapApprovalTransaction.from,
      input: zapApprovalTransaction.data,
      to: zapApprovalTransaction.to,
      save: true
    };

    return await this.simulationExecutor.makeSimulationRequest(body, forkId);
  }
}
