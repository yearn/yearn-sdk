import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress, WethAddress, ZeroAddress } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import { SimulationExecutor, SimulationResponse } from "../simulationExecutor";
import { Address, Integer, SdkError, ZapApprovalTransactionOutput, ZapProtocol } from "../types";
import { SimulationOptions, TransactionOutcome } from "../types/custom/simulation";
import { PickleJarContract, VaultContract, YearnVaultContract } from "../vault";

/**
 * [[SimulationInterface]] allows the simulation of ethereum transactions using Tenderly's api.
 * This allows us to know information before executing a transaction on mainnet.
 * For example it can simulate how much slippage is likely to be experienced when withdrawing from a vault,
 * or how many underlying tokens the user will receive upon withdrawing share tokens.
 */
export class SimulationInterface<T extends ChainId> extends ServiceInterface<T> {
  private simulationExecutor = new SimulationExecutor(this.yearn.services.telegram, this.ctx);

  async deposit(
    from: Address,
    sellToken: Address,
    amount: Integer,
    toVault: Address,
    options: SimulationOptions = {}
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
      if (!options.slippage) {
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
      options.forkId = forkId;

      const approvalTransactionId = needsApproving
        ? await this.yearn.services.zapper
            .zapInApprovalTransaction(from, sellToken, "0", zapProtocol)
            .then(async approvalTransaction => {
              return await this.simulateZapApprovalTransaction(approvalTransaction, options);
            })
            .then(res => res.simulation.id)
        : undefined;
      options.root = approvalTransactionId;

      simulateDeposit = (save: boolean) => {
        options.save = save;
        return this.zapIn(
          from,
          sellToken,
          underlyingToken,
          amount,
          toVault,
          vaultContract,
          zapProtocol,
          needsApproving,
          options
        );
      };
    } else {
      const needsApproving = await this.depositNeedsApproving(from, sellToken, toVault, amount, signer);

      forkId = needsApproving ? await this.simulationExecutor.createFork() : undefined;
      options.forkId = forkId;

      const approvalTransactionId = needsApproving
        ? await this.approve(from, sellToken, amount, toVault, options)
        : undefined;
      options.root = approvalTransactionId;

      simulateDeposit = (save: boolean) => {
        options.save = save;
        return this.directDeposit(from, sellToken, amount, toVault, vaultContract, options);
      };
    }
    return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateDeposit, forkId);
  }

  async withdraw(
    from: Address,
    fromVault: Address,
    amount: Integer,
    toToken: Address,
    options: SimulationOptions = {}
  ): Promise<TransactionOutcome> {
    const signer = this.ctx.provider.write.getSigner(from);
    const vaultContract = new YearnVaultContract(fromVault, signer);
    const underlyingToken = await vaultContract.token();
    const isZapping = underlyingToken !== getAddress(toToken);
    let forkId: string | undefined;
    let simulateWithdrawal: (save: boolean) => Promise<TransactionOutcome>;

    if (isZapping) {
      if (!options.slippage) {
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
      options.forkId = forkId;
      const approvalSimulationId = needsApproving
        ? await this.yearn.services.zapper
            .zapOutApprovalTransaction(from, fromVault, "0")
            .then(async approvalTransaction => {
              return await this.simulateZapApprovalTransaction(approvalTransaction, options);
            })
            .then(res => res.simulation.id)
        : undefined;

      options.root = approvalSimulationId;

      simulateWithdrawal = (save: boolean) => {
        options.save = save;
        return this.zapOut(from, toToken, underlyingToken, amount, fromVault, needsApproving, options);
      };
    } else {
      simulateWithdrawal = (save: boolean) => {
        options.save = save;
        return this.directWithdraw(from, toToken, amount, fromVault, vaultContract, options);
      };
    }
    return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateWithdrawal, forkId);
  }

  private async approve(
    from: Address,
    token: Address,
    amount: Integer,
    vault: Address,
    options: SimulationOptions
  ): Promise<string> {
    const TokenAbi = ["function approve(address spender, uint256 amount) returns (bool)"];
    const signer = this.ctx.provider.write.getSigner(from);
    const tokenContract = new Contract(token, TokenAbi, signer);
    const encodedInputData = tokenContract.interface.encodeFunctionData("approve", [vault, amount]);
    options.save = true;

    const simulationResponse: SimulationResponse = await this.simulationExecutor.makeSimulationRequest(
      from,
      token,
      encodedInputData,
      options
    );

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
    options: SimulationOptions
  ): Promise<TransactionOutcome> {
    const encodedInputData = vaultContract.encodeDeposit(amount);

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(
      from,
      toVault,
      encodedInputData,
      toVault,
      options
    );

    const targetTokenAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(toVault, tokensReceived);

    const [decimals, pricePerShare] = await Promise.all([vaultContract.decimals(), vaultContract.pricePerShare()]);
    const targetUnderlyingTokensReceived = new BigNumber(tokensReceived)
      .div(new BigNumber(10).pow(decimals))
      .multipliedBy(pricePerShare)
      .toFixed(0);

    const result: TransactionOutcome = {
      sourceTokenAddress: sellToken,
      sourceTokenAmount: amount,
      targetTokenAddress: toVault,
      targetTokenAmount: tokensReceived,
      targetTokenAmountUsdc: targetTokenAmountUsdc,
      targetUnderlyingTokenAddress: toVault,
      targetUnderlyingTokenAmount: targetUnderlyingTokensReceived,
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
    zapProtocol: ZapProtocol,
    skipGasEstimate: boolean,
    options: SimulationOptions
  ): Promise<TransactionOutcome> {
    const zapToken = sellToken === EthAddress ? ZeroAddress : sellToken;

    if (!options.slippage) {
      throw new SdkError("slippage needs to be set");
    }

    const zapInParams = await this.yearn.services.zapper.zapIn(
      from,
      zapToken,
      amount,
      toVault,
      options.gasPrice || "0",
      options.slippage,
      skipGasEstimate,
      zapProtocol
    );
    const value = new BigNumber(zapInParams.value).toFixed(0);

    options.gasPrice = options.gasPrice || zapInParams.gasPrice;
    if (!skipGasEstimate) {
      options.gasLimit = zapInParams.gas;
    }

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(
      from,
      zapInParams.to,
      zapInParams.data,
      toVault,
      options,
      value
    );

    const [decimals, pricePerShare] = await Promise.all([vaultContract.decimals(), vaultContract.pricePerShare()]);
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
    options: SimulationOptions
  ): Promise<TransactionOutcome> {
    const encodedInputData = vaultContract.encodeWithdraw(amount);

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(
      from,
      fromVault,
      encodedInputData,
      toToken,
      options
    );

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
    skipGasEstimate: boolean,
    options: SimulationOptions
  ): Promise<TransactionOutcome> {
    if (!options.slippage) {
      throw new SdkError("slippage needs to be set");
    }

    const zapToken = toToken === EthAddress ? ZeroAddress : toToken;
    const zapOutParams = await this.yearn.services.zapper.zapOut(
      from,
      zapToken,
      amount,
      fromVault,
      "0",
      options.slippage,
      skipGasEstimate
    );

    if (!skipGasEstimate) {
      options.gasLimit = zapOutParams.gas;
    }

    const tokensReceived = await (async () => {
      if (zapToken === ZeroAddress) {
        let response: SimulationResponse = await this.simulationExecutor.makeSimulationRequest(
          from,
          zapOutParams.to,
          zapOutParams.data,
          options,
          zapOutParams.value
        );
        return new BigNumber(response.transaction.transaction_info.call_trace.output).toFixed(0);
      } else {
        return await this.simulationExecutor.simulateVaultInteraction(
          from,
          zapOutParams.to,
          zapOutParams.data,
          toToken,
          options,
          zapOutParams.value
        );
      }
    })();

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
      targetUnderlyingTokenAmount: tokensReceived,
      conversionRate: conversionRate,
      slippage: 1 - conversionRate
    };

    return result;
  }

  private async simulateZapApprovalTransaction(
    zapApprovalTransaction: ZapApprovalTransactionOutput,
    options: SimulationOptions
  ): Promise<SimulationResponse> {
    options.save = true;
    return await this.simulationExecutor.makeSimulationRequest(
      zapApprovalTransaction.from,
      zapApprovalTransaction.to,
      zapApprovalTransaction.data,
      options
    );
  }
}
