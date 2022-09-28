import { getAddress } from "@ethersproject/address";
import { CallOverrides, Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { getWrapperIfNative, isNativeToken } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import { SimulationExecutor, SimulationResponse } from "../simulationExecutor";
import {
  Address,
  DepositOptions,
  EthersError,
  Integer,
  PriceFetchingError,
  SdkError,
  SimulationError,
  SimulationOptions,
  Token,
  TransactionOutcome,
  ZapError,
  ZappableVault,
  ZapProtocol,
} from "../types";
import { toBN, toUnit } from "../utils";
import { PickleJarContract, VaultContract, YearnVaultContract } from "../vault";
import { getZapInDetails, ZapInWith } from "../zap";

export type DepositArgs = {
  from: Address;
  sellToken: Address;
  amount: Integer;
  toVault: Address;
  options: SimulationOptions;
};

type DirectDepositArgs = {
  depositArgs: DepositArgs;
  vault: ZappableVault;
  vaultContract: VaultContract;
};

type ZapInSimulationDepositArgs = {
  zapInWith: ZapInWith;
  vault: ZappableVault;
  depositArgs: DepositArgs;
};

type DirectDepositSimulationArgs = {
  vaultContract: VaultContractType;
  vault: ZappableVault;
  depositArgs: DepositArgs;
  signer: JsonRpcSigner;
};

type ApprovalData = { approvalTransactionId?: string; forkId?: string };

type VaultContractType = PickleJarContract | YearnVaultContract;

import { getZapOutDetails, ZapOutWith } from "../zap";

type WithdrawArgs = {
  from: Address;
  fromVault: Address;
  amount: Integer;
  toToken: Address;
  options: SimulationOptions;
};

type DirectWithdrawArgs = {
  from: Address;
  toToken: Address;
  amount: Integer;
  fromVault: Address;
  vaultContract: VaultContract;
  options: SimulationOptions;
};

type ZapOutArgs = {
  from: Address;
  toToken: Address;
  underlyingTokenAddress: Address;
  amount: Integer;
  fromVault: Address;
  skipGasEstimate: boolean;
  options: SimulationOptions;
};

type ZapOutSimulationArgs = {
  zapOutWith: ZapOutWith;
  token: Token;
  withdrawArgs: WithdrawArgs;
};

/**
 * [[SimulationInterface]] allows the simulation of ethereum transactions using Tenderly's api.
 * This allows us to know information before executing a transaction on mainnet.
 * For example it can simulate how much slippage is likely to be experienced when withdrawing from a vault,
 * or how many underlying tokens the user will receive upon withdrawing share tokens.
 */
export class SimulationInterface<T extends ChainId> extends ServiceInterface<T> {
  private simulationExecutor = new SimulationExecutor(this.yearn.services.telegram, this.chainId, this.ctx);

  async deposit(
    from: Address,
    sellToken: Address,
    amount: Integer,
    toVault: Address,
    options: SimulationOptions = {}
  ): Promise<TransactionOutcome> {
    const depositArgs = { from, sellToken, amount, toVault, options };

    const signer = this.ctx.provider.write.getSigner(from);

    const vaultContract = this.getVaultContract({ toVault, signer });

    const vault = await this.getZappableVault({ vaultAddress: toVault, vaultContract });

    if (!vault) {
      throw new SdkError(`Could not get vault: ${toVault}`);
    }

    const token = await this.yearn.tokens.findByAddress(sellToken);

    if (!token) {
      throw new SdkError(`Could not find the token by address: ${sellToken}`);
    }

    const isUnderlyingToken = await this.isUnderlyingToken({ vault: toVault, address: token.address });

    if (isUnderlyingToken) {
      return this.handleDirectSimulationDeposit({ depositArgs, vaultContract, vault, signer });
    }

    const { isZapInSupported, zapInWith } = getZapInDetails({ chainId: this.chainId, token, vault });

    if (isZapInSupported && zapInWith) {
      return this.handleZapInSimulationDeposit({ depositArgs, zapInWith, vault });
    }

    throw new SdkError(`Deposit of ${token.address} to ${toVault} is not supported`);
  }

  async _deposit(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    options: DepositOptions = {},
    overrides: CallOverrides = {}
  ): Promise<TransactionOutcome> {
    const forkId = await this.simulationExecutor.createFork();
    const allowance = await this.yearn.vaults.getDepositAllowance(account, vault, token);

    let approveSimulationId;
    const needsApprove = toBN(amount).gt(allowance.amount);
    if (needsApprove) {
      const { from, to, data, value } = await this.yearn.vaults.populateApproveDeposit(
        account,
        vault,
        token,
        amount,
        overrides
      );
      if (!from || !to || !data) throw Error("Error populating approve transaction");

      const { simulation } = await this.simulationExecutor.makeSimulationRequest(
        from,
        to,
        data,
        {
          forkId,
          save: true,
        },
        value ? value.toString() : undefined
      );
      approveSimulationId = simulation.id;
    }

    const { from, to, data, value } = await this.yearn.vaults.populateDepositTransaction({
      vault,
      token,
      amount,
      account,
      options: { ...options, skipGasEstimate: needsApprove },
      overrides,
    });
    if (!from || !to || !data) throw Error("Error populating deposit transaction");

    const simulationOutcome = await this.simulationExecutor.makeSimulationRequest(
      from,
      to,
      data,
      {
        forkId,
        root: approveSimulationId,
        save: true,
      },
      value ? value.toString() : undefined
    );

    await this.simulationExecutor.deleteFork(forkId);

    return await this.parseDepositSimulationOutcome(vault, token, amount, account, simulationOutcome);
  }

  private async parseDepositSimulationOutcome(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    simulationOutcome: SimulationResponse
  ): Promise<TransactionOutcome> {
    const sourceToken = await this.yearn.tokens.findByAddress(getWrapperIfNative(token, this.chainId));
    const [vaultData] = await this.yearn.vaults.get([vault]);
    const targetTokenAmount = await this.parseSimulationTargetTokenAmount(vault, account, simulationOutcome);
    const sourceTokenAmountUsdc = toBN(sourceToken?.priceUsdc)
      .times(toUnit({ amount, decimals: Number(sourceToken?.decimals) }))
      .toFixed(0);
    const targetTokenAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(vault, targetTokenAmount);
    const targetUnderlyingTokenAmount = toBN(targetTokenAmount)
      .div(toBN(10).pow(vaultData.decimals))
      .multipliedBy(vaultData.metadata.pricePerShare)
      .toFixed(0);
    const conversionRate = toBN(sourceTokenAmountUsdc).eq(0)
      ? 0
      : toBN(targetTokenAmountUsdc).div(sourceTokenAmountUsdc).toNumber();

    return {
      sourceTokenAddress: token,
      sourceTokenAmount: amount,
      targetTokenAddress: vault,
      targetTokenAmount,
      targetTokenAmountUsdc,
      targetUnderlyingTokenAddress: vault,
      targetUnderlyingTokenAmount,
      conversionRate,
      slippage: toBN(1).minus(conversionRate).toNumber(),
    };
  }

  private async parseSimulationTargetTokenAmount(
    targetToken: Address,
    account: Address,
    simulationOutcome: SimulationResponse
  ): Promise<Integer> {
    if (isNativeToken(targetToken))
      return toBN(simulationOutcome.transaction.transaction_info.call_trace.output).toFixed(0);

    const encodedTransferFunction = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // keccak256("Transfer(address,address,uint256)")
    const transferDataLog = simulationOutcome.transaction.transaction_info.logs
      .reverse()
      .find(
        (log) =>
          log.raw.topics[0] === encodedTransferFunction &&
          getAddress(log.raw.topics[2].slice(-40)) === getAddress(account)
      );

    if (!transferDataLog)
      throw new SimulationError(`No log of transferring token to ${account}`, SimulationError.NO_LOG);

    return toBN(transferDataLog.raw.data).toFixed(0);
  }

  async withdraw(
    from: Address,
    fromVault: Address,
    amount: Integer,
    toToken: Address,
    options: SimulationOptions = {}
  ): Promise<TransactionOutcome> {
    const withdrawArgs = { from, fromVault, amount, toToken, options };

    const signer = this.ctx.provider.write.getSigner(from);
    const vaultContract = new YearnVaultContract(fromVault, signer);

    const [vault] = await this.yearn.vaults.get([fromVault]);

    if (!vault) {
      throw new SdkError(`Could not get vault: ${fromVault}`);
    }

    const token = await this.yearn.tokens.findByAddress(toToken);

    if (!token) {
      throw new SdkError(`Could not find the token by address: ${toToken}`);
    }

    const isUnderlyingToken = await this.isUnderlyingToken({ vault: fromVault, address: token.address });

    if (isUnderlyingToken) {
      const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
        return this.directWithdraw({ ...withdrawArgs, vaultContract, options: { ...options, save } });
      };
      return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn);
    }

    const { isZapOutSupported, zapOutWith } = getZapOutDetails({ chainId: this.chainId, token, vault });

    if (isZapOutSupported && zapOutWith) {
      return this.handleZapOutSimulation({ withdrawArgs, zapOutWith, token });
    }

    throw new SdkError(`Withdraw from ${fromVault} to ${toToken} is not supported`);
  }

  async _withdraw(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    options: DepositOptions = {},
    overrides: CallOverrides = {}
  ): Promise<TransactionOutcome> {
    const forkId = await this.simulationExecutor.createFork();
    const allowance = await this.yearn.vaults.getWithdrawAllowance(account, vault, token);

    let approveSimulationId;
    const needsApprove = toBN(amount).gt(allowance.amount);
    if (needsApprove) {
      const { from, to, data, value } = await this.yearn.vaults.populateApproveWithdraw(
        account,
        vault,
        token,
        amount,
        overrides
      );
      if (!from || !to || !data) throw Error("Error populating approve transaction");

      const { simulation } = await this.simulationExecutor.makeSimulationRequest(
        from,
        to,
        data,
        {
          forkId,
          save: true,
        },
        value ? value.toString() : undefined
      );
      approveSimulationId = simulation.id;
    }

    const { from, to, data, value } = await this.yearn.vaults.populateWithdrawTransaction({
      vault,
      token,
      amount,
      account,
      options: { ...options, skipGasEstimate: needsApprove },
      overrides,
    });
    if (!from || !to || !data) throw Error("Error populating withdraw transaction");

    const simulationOutcome = await this.simulationExecutor.makeSimulationRequest(
      from,
      to,
      data,
      {
        forkId,
        root: approveSimulationId,
        save: true,
      },
      value ? value.toString() : undefined
    );

    await this.simulationExecutor.deleteFork(forkId);

    return await this.parseWithdrawSimulationOutcome(vault, token, amount, account, simulationOutcome);
  }

  private async parseWithdrawSimulationOutcome(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    simulationOutcome: SimulationResponse
  ): Promise<TransactionOutcome> {
    const targetTokenAmount = await this.parseSimulationTargetTokenAmount(token, account, simulationOutcome);
    const sourceTokenAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(vault, amount);
    const targetToken = await this.yearn.tokens.findByAddress(getWrapperIfNative(token, this.chainId));
    const targetTokenAmountUsdc = toBN(targetToken?.priceUsdc)
      .times(toUnit({ amount: targetTokenAmount, decimals: Number(targetToken?.decimals) }))
      .toFixed(0);
    const conversionRate = toBN(sourceTokenAmountUsdc).eq(0)
      ? 0
      : toBN(targetTokenAmountUsdc).div(sourceTokenAmountUsdc).toNumber();

    return {
      sourceTokenAddress: vault,
      sourceTokenAmount: amount,
      targetTokenAddress: token,
      targetTokenAmount,
      targetTokenAmountUsdc,
      targetUnderlyingTokenAddress: vault,
      targetUnderlyingTokenAmount: targetTokenAmount,
      conversionRate,
      slippage: toBN(1).minus(conversionRate).toNumber(),
    };
  }

  private async handleDirectSimulationDeposit({
    depositArgs,
    vaultContract,
    vault,
    signer,
  }: DirectDepositSimulationArgs): Promise<TransactionOutcome> {
    const { approvalTransactionId: root, forkId } = await this.getApprovalData({ depositArgs, signer });

    const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
      return this.directDeposit({
        depositArgs: { ...depositArgs, options: { ...depositArgs.options, forkId, save, root } },
        vaultContract,
        vault,
      });
    };

    return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, forkId);
  }

  private async directDeposit({
    depositArgs: { toVault, amount, from, sellToken, options },
    vaultContract,
    vault,
  }: DirectDepositArgs): Promise<TransactionOutcome> {
    const encodedInputData = await this.getEncodedInputData({ vaultContract, amount, toVault });

    if (!encodedInputData) {
      throw new SdkError("directDeposit#encodeDeposit failed");
    }

    const addressToDeposit = await this.getActionableAddress({ toVault });

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(
      from,
      addressToDeposit,
      encodedInputData,
      toVault,
      options
    );

    const targetTokenAmountUsdc = await this.yearn.services.oracle
      .getNormalizedValueUsdc(toVault, tokensReceived)
      .catch(() => {
        throw new PriceFetchingError("Error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
      });

    const {
      decimals,
      metadata: { pricePerShare },
    } = vault;

    if (!decimals) {
      throw new SdkError(`Decimals missing for vault ${vault.address}`);
    }

    if (!pricePerShare) {
      throw new SdkError(`Price per share missing in vault ${vault.address} metadata`);
    }

    const targetUnderlyingTokensReceived = toBN(tokensReceived)
      .div(toBN(10).pow(decimals))
      .multipliedBy(pricePerShare)
      .toFixed(0);

    return {
      sourceTokenAddress: sellToken,
      sourceTokenAmount: amount,
      targetTokenAddress: toVault,
      targetTokenAmount: tokensReceived,
      targetTokenAmountUsdc: targetTokenAmountUsdc,
      targetUnderlyingTokenAddress: toVault,
      targetUnderlyingTokenAmount: targetUnderlyingTokensReceived,
      conversionRate: 1,
      slippage: 0,
    };
  }

  private async getEncodedInputData({
    vaultContract,
    amount,
    toVault,
  }: {
    vaultContract: VaultContract;
    amount: Integer;
    toVault: Address;
  }): Promise<Address | undefined> {
    if (!this.shouldUsePartnerService(toVault)) {
      return vaultContract.encodeDeposit(amount);
    }

    return this.yearn.services.partner?.encodeDeposit(toVault, amount);
  }

  private async getActionableAddress({ toVault }: { toVault: Address }): Promise<Address> {
    if (!this.shouldUsePartnerService(toVault)) {
      return toVault;
    }

    const partnerAddress = await this.yearn.services.partner?.address;

    return partnerAddress || toVault;
  }

  private async depositNeedsApproving({
    depositArgs: { from, sellToken, amount, toVault },
    signer,
  }: {
    depositArgs: DepositArgs;
    signer: JsonRpcSigner;
  }): Promise<boolean> {
    const TokenAbi = ["function allowance(address owner, address spender) view returns (uint256)"];
    const contract = new Contract(sellToken, TokenAbi, signer);
    const addressToCheck = await this.getActionableAddress({ toVault });

    try {
      const allowance = await contract.allowance(from, addressToCheck);
      return toBN(allowance.toString()).lt(toBN(amount));
    } catch (error) {
      throw new SdkError(`Failed to get allowance from the contract: ${error}`);
    }
  }

  private async zapIn({
    depositArgs: { sellToken, from, amount, toVault, options },
    vault,
    skipGasEstimate,
    zapInWith,
  }: {
    depositArgs: DepositArgs;
    vault: ZappableVault;
    skipGasEstimate: boolean;
    zapInWith: ZapInWith;
  }): Promise<TransactionOutcome> {
    if (!options.slippage) {
      throw new SdkError("slippage needs to be set", SdkError.NO_SLIPPAGE);
    }

    const partnerId = this.yearn.services.partner?.partnerId;
    const zapProtocol = this.getZapProtocol({ vaultAddress: toVault });

    let zapInPromise;

    if (zapInWith === "portalsZapIn") {
      zapInPromise = this.yearn.services.portals.zapIn(
        toVault,
        sellToken,
        amount,
        from,
        options.slippage,
        !skipGasEstimate,
        partnerId
      );
    } else if (zapInWith === "widoZapIn") {
      zapInPromise = this.yearn.services.wido.zapIn(toVault, sellToken, amount, from, options.slippage);
    } else {
      throw new Error("zapInWith not supported");
    }

    const zapInParams = await zapInPromise.catch(() => {
      throw new ZapError("zap in", ZapError.ZAP_IN);
    });
    if (!zapInParams.from || !zapInParams.to || !zapInParams.data) throw new ZapError("zap in", ZapError.ZAP_IN);

    const value = toBN(zapInParams.value?.toString()).toFixed(0);

    options.gasPrice = options.gasPrice || zapInParams.gasPrice?.toString();
    if (!skipGasEstimate) {
      options.gasLimit = zapInParams.gasLimit?.toString();
    }

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(
      from,
      zapInParams.to,
      zapInParams.data,
      toVault,
      options,
      value
    );

    const {
      decimals,
      metadata: { pricePerShare },
      token: underlyingTokenAddress,
    } = vault;

    if (!decimals) {
      throw new SdkError(`Decimals missing for vault ${vault.address}`);
    }

    if (!pricePerShare) {
      throw new SdkError(`Price per share missing in vault ${vault.address} metadata`);
    }

    const targetUnderlyingTokensReceived = toBN(tokensReceived)
      .div(toBN(10).pow(decimals))
      .multipliedBy(pricePerShare)
      .toFixed(0);

    let amountReceivedUsdc: BigNumber;

    switch (zapProtocol) {
      case ZapProtocol.YEARN:
        amountReceivedUsdc = await this.yearn.services.oracle
          .getNormalizedValueUsdc(toVault, tokensReceived)
          .then((price) => toBN(price))
          .catch(() => {
            throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
          });
        break;
      case ZapProtocol.PICKLE:
        amountReceivedUsdc = (
          await this.yearn.services.pickle
            .getPriceUsdc(toVault)
            .catch(() => {
              throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_PICKLE);
            })
            .then((usdc) => toBN(usdc))
        )
          .dividedBy(toBN(10).pow(decimals))
          .multipliedBy(toBN(tokensReceived));
        break;
    }

    const zapInAmountUsdc = toBN(
      await this.yearn.services.oracle
        .getNormalizedValueUsdc(getWrapperIfNative(sellToken, this.chainId), amount)
        .catch(() => {
          throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
        })
    );

    const conversionRate = amountReceivedUsdc.div(zapInAmountUsdc).toNumber();

    return {
      sourceTokenAddress: sellToken,
      sourceTokenAmount: amount,
      targetTokenAddress: toVault,
      targetTokenAmount: tokensReceived,
      targetTokenAmountUsdc: amountReceivedUsdc.toFixed(0),
      targetUnderlyingTokenAddress: underlyingTokenAddress,
      targetUnderlyingTokenAmount: targetUnderlyingTokensReceived,
      conversionRate: conversionRate,
      slippage: 1 - conversionRate,
    };
  }

  private async getZapOutApprovalData(
    { from, fromVault, amount, toToken, options }: WithdrawArgs,
    zapOutWith: ZapOutWith
  ) {
    try {
      let zapOutApprovalStatePromise;
      if (zapOutWith === "portalsZapOut") {
        zapOutApprovalStatePromise = this.yearn.services.portals.zapOutApprovalState(fromVault, toToken, amount, from);
      } else if (zapOutWith === "widoZapOut") {
        zapOutApprovalStatePromise = this.yearn.services.wido.zapOutApprovalState(fromVault, from);
      } else {
        throw new Error("zapInWith not supported");
      }

      const allowance = await zapOutApprovalStatePromise;
      const isApproved = toBN(allowance.amount).gte(amount);
      if (isApproved) {
        return { needsApproving: false };
      }
    } catch (error) {
      throw new ZapError("zap out approval state", ZapError.ZAP_OUT_APPROVAL_STATE);
    }

    const forkId = await this.simulationExecutor.createFork();

    try {
      let zapOutApprovalTxPromise;
      if (zapOutWith === "portalsZapOut") {
        zapOutApprovalTxPromise = this.yearn.services.portals.zapOutApprovalTransaction(
          fromVault,
          toToken,
          amount,
          from
        );
      } else if (zapOutWith === "widoZapOut") {
        zapOutApprovalTxPromise = this.yearn.services.wido.zapOutApprovalTransaction(fromVault, amount);
      } else {
        throw new Error("zapInWith not supported");
      }

      const zapApprovalTransaction = await zapOutApprovalTxPromise;
      if (!zapApprovalTransaction.from || !zapApprovalTransaction.to || !zapApprovalTransaction.data)
        throw new ZapError("zap out approval transaction", ZapError.ZAP_OUT_APPROVAL);

      const { simulation } = await this.simulationExecutor.makeSimulationRequest(
        zapApprovalTransaction.from,
        zapApprovalTransaction.to,
        zapApprovalTransaction.data,
        { ...options, forkId, save: true }
      );

      return { needsApproving: true, root: simulation.id, forkId };
    } catch (error) {
      throw new ZapError("zap out approval transaction", ZapError.ZAP_OUT_APPROVAL);
    }
  }

  private async directWithdraw({
    from,
    toToken,
    amount,
    fromVault,
    vaultContract,
    options,
  }: DirectWithdrawArgs): Promise<TransactionOutcome> {
    const encodedInputData = vaultContract.encodeWithdraw(amount);

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(
      from,
      fromVault,
      encodedInputData,
      toToken,
      options
    );

    const targetTokenAmountUsdc = await this.yearn.services.oracle
      .getNormalizedValueUsdc(toToken, tokensReceived)
      .catch(() => {
        throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
      });

    return {
      sourceTokenAddress: fromVault,
      sourceTokenAmount: amount,
      targetTokenAddress: toToken,
      targetTokenAmount: tokensReceived,
      targetTokenAmountUsdc: targetTokenAmountUsdc,
      targetUnderlyingTokenAddress: toToken,
      targetUnderlyingTokenAmount: tokensReceived,
      conversionRate: 1,
      slippage: 0,
    };
  }

  private async zapOut(
    { from, toToken, underlyingTokenAddress, amount, fromVault, skipGasEstimate, options }: ZapOutArgs,
    zapOutWith: ZapOutWith
  ): Promise<TransactionOutcome> {
    if (!options.slippage) {
      throw new SdkError("slippage needs to be set", SdkError.NO_SLIPPAGE);
    }

    let zapOutPromise;

    if (zapOutWith === "portalsZapOut") {
      zapOutPromise = this.yearn.services.portals.zapOut(
        fromVault,
        toToken,
        amount,
        from,
        options.slippage,
        skipGasEstimate
      );
    } else if (zapOutWith === "widoZapOut") {
      zapOutPromise = this.yearn.services.wido.zapOut(fromVault, toToken, amount, from, options.slippage);
    } else {
      throw new Error("zapOutWith not supported");
    }

    const zapOutParams = await zapOutPromise.catch(() => {
      throw new ZapError("error zapping out", ZapError.ZAP_OUT);
    });

    if (!skipGasEstimate) {
      options.gasLimit = zapOutParams.gasLimit?.toString();
    }

    const tokensReceived = await (async (): Promise<string> => {
      if (!zapOutParams.from || !zapOutParams.to || !zapOutParams.data)
        throw new ZapError("error zapping out", ZapError.ZAP_OUT);
      if (isNativeToken(toToken)) {
        const response: SimulationResponse = await this.simulationExecutor.makeSimulationRequest(
          from,
          zapOutParams.to,
          zapOutParams.data,
          options,
          zapOutParams.value?.toString()
        );
        return toBN(response.transaction.transaction_info.call_trace.output).toFixed(0);
      } else {
        return await this.simulationExecutor.simulateVaultInteraction(
          from,
          zapOutParams.to,
          zapOutParams.data,
          toToken,
          options,
          zapOutParams.value?.toString()
        );
      }
    })();

    const zapOutAmountUsdc = await this.yearn.services.oracle
      .getNormalizedValueUsdc(getWrapperIfNative(toToken, this.chainId), tokensReceived)
      .catch(() => {
        throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
      });
    const soldAssetAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(fromVault, amount).catch(() => {
      throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
    });

    const conversionRate = toBN(zapOutAmountUsdc).div(toBN(soldAssetAmountUsdc)).toNumber();

    return {
      sourceTokenAddress: fromVault,
      sourceTokenAmount: amount,
      targetTokenAddress: toToken,
      targetTokenAmount: tokensReceived,
      targetTokenAmountUsdc: zapOutAmountUsdc,
      targetUnderlyingTokenAddress: underlyingTokenAddress,
      targetUnderlyingTokenAmount: tokensReceived,
      conversionRate: conversionRate,
      slippage: 1 - conversionRate,
    };
  }

  private shouldUsePartnerService(vault: Address): boolean {
    return !!this.yearn.services.partner?.isAllowed(vault);
  }

  private async getZapInApprovalData(
    { sellToken, from, amount, toVault, options }: DepositArgs,
    zapInWith: ZapInWith
  ): Promise<{ needsApproving: boolean } & ApprovalData> {
    if (isNativeToken(sellToken)) {
      return { needsApproving: false };
    }

    let zapInApprovalStatePromise;
    if (zapInWith === "portalsZapIn") {
      zapInApprovalStatePromise = this.yearn.services.portals.zapInApprovalState(toVault, sellToken, amount, from);
    } else if (zapInWith === "widoZapIn") {
      zapInApprovalStatePromise = this.yearn.services.wido.zapInApprovalState(sellToken, from);
    } else {
      throw new Error("zapInWith not supported");
    }

    const allowance = await zapInApprovalStatePromise.catch(() => {
      throw new ZapError("approval state", ZapError.ZAP_IN_APPROVAL_STATE);
    });
    const isApprovalNeeded = toBN(allowance.amount).gte(amount);

    if (!isApprovalNeeded) {
      return { needsApproving: false };
    }

    const forkId = await this.simulationExecutor.createFork();

    let zapInApprovalTxPromise;
    if (zapInWith === "portalsZapIn") {
      zapInApprovalTxPromise = this.yearn.services.portals.zapInApprovalTransaction(toVault, sellToken, amount, from);
    } else if (zapInWith === "widoZapIn") {
      zapInApprovalTxPromise = this.yearn.services.wido.zapInApprovalTransaction(sellToken, amount);
    } else {
      throw new Error("zapInWith not supported");
    }

    const approvalTransactionId = await zapInApprovalTxPromise
      .catch(() => {
        throw new ZapError("approval", ZapError.ZAP_IN_APPROVAL);
      })
      .then(async ({ from, to, data }) => {
        if (!from || !to || !data) throw new ZapError("approval", ZapError.ZAP_IN_APPROVAL);
        return this.simulationExecutor.makeSimulationRequest(from, to, data as string, {
          ...options,
          forkId,
          save: true,
        });
      })
      .then((res) => res.simulation.id);

    return {
      needsApproving: true,
      approvalTransactionId,
      forkId,
    };
  }

  private async getZapInSimulationArgs({
    depositArgs,
    vault,
    zapInWith,
  }: {
    depositArgs: DepositArgs;
    vault: ZappableVault;
    zapInWith: ZapInWith;
  }): Promise<{ simulateFn: (save: boolean) => Promise<TransactionOutcome>; forkId?: string }> {
    if (!depositArgs.options.slippage) {
      throw new SdkError("slippage needs to be specified for a zap", SdkError.NO_SLIPPAGE);
    }

    const { needsApproving, approvalTransactionId, forkId } = await this.getZapInApprovalData(depositArgs, zapInWith);

    const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
      return this.zapIn({
        depositArgs: {
          ...depositArgs,
          options: { ...depositArgs.options, forkId, save, root: approvalTransactionId },
        },
        vault,
        skipGasEstimate: needsApproving,
        zapInWith,
      });
    };

    return { simulateFn, forkId };
  }

  private async approve({ from, sellToken, amount, toVault, options }: DepositArgs): Promise<string> {
    const tokenAbi = ["function approve(address spender, uint256 amount) returns (bool)"];
    const signer = this.ctx.provider.write.getSigner(from);
    const tokenContract = new Contract(sellToken, tokenAbi, signer);

    const addressToApprove = await this.getActionableAddress({ toVault });

    const encodedInputData = tokenContract.interface.encodeFunctionData("approve", [addressToApprove, amount]);

    const simulationResponse: SimulationResponse = await this.simulationExecutor.makeSimulationRequest(
      from,
      sellToken,
      encodedInputData,
      { ...options, save: true }
    );

    return simulationResponse.simulation.id;
  }

  private async getApprovalData({
    depositArgs,
    signer,
  }: {
    depositArgs: DepositArgs;
    signer: JsonRpcSigner;
  }): Promise<ApprovalData> {
    const depositNeedsApproving = await this.depositNeedsApproving({ depositArgs, signer });

    if (!depositNeedsApproving) {
      return {};
    }

    const forkId = await this.simulationExecutor.createFork();

    const approvalTransactionId = await this.approve({ ...depositArgs, options: { ...depositArgs.options, forkId } });

    return { approvalTransactionId, forkId };
  }

  private getVaultContract({ toVault, signer }: { toVault: Address; signer: JsonRpcSigner }): VaultContractType {
    const zapProtocol = this.getZapProtocol({ vaultAddress: toVault });

    return zapProtocol === ZapProtocol.PICKLE
      ? new PickleJarContract(toVault, signer)
      : new YearnVaultContract(toVault, signer);
  }

  private async handleZapInSimulationDeposit({ zapInWith, vault, depositArgs }: ZapInSimulationDepositArgs) {
    if (zapInWith === "portalsZapIn" || zapInWith === "widoZapIn") {
      const { simulateFn, forkId } = await this.getZapInSimulationArgs({ depositArgs, vault, zapInWith });

      return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, forkId);
    }

    throw new SdkError(`zapInWith "${zapInWith}" not supported yet!`);
  }

  private async isUnderlyingToken({ vault, address }: { vault: Address; address: Token["address"] }): Promise<boolean> {
    if (PickleJars.includes(vault)) {
      return false;
    }

    return this.yearn.vaults.isUnderlyingToken(vault, address);
  }

  private async getZappableVault({
    vaultAddress,
    vaultContract,
  }: {
    vaultAddress: Address;
    vaultContract: VaultContractType;
  }): Promise<ZappableVault> {
    const zapProtocol = this.getZapProtocol({ vaultAddress });

    if (zapProtocol === ZapProtocol.PICKLE) {
      const [decimals, pricePerShare] = await Promise.all([
        vaultContract.decimals().catch(() => {
          throw new EthersError("no decimals", EthersError.NO_DECIMALS);
        }),
        vaultContract.pricePerShare().catch(() => {
          throw new EthersError("no price per share", EthersError.NO_PRICE_PER_SHARE);
        }),
      ]);

      return {
        address: vaultAddress,
        token: "0x9461173740d27311b176476fa27e94c681b1ea6b",
        decimals: decimals.toString(),
        metadata: {
          zapInWith: "portalsZapIn",
          zapOutWith: "portalsZapOut",
          pricePerShare: pricePerShare.toString(),
        },
      };
    }

    const [vault] = await this.yearn.vaults.get([vaultAddress]);

    return vault;
  }

  private getZapProtocol({ vaultAddress }: { vaultAddress: Address }): ZapProtocol {
    return PickleJars.includes(vaultAddress) ? ZapProtocol.PICKLE : ZapProtocol.YEARN;
  }

  private async getZapOutSimulationArgs({
    withdrawArgs,
    token: { address: underlyingTokenAddress },
    zapOutWith,
  }: {
    withdrawArgs: WithdrawArgs;
    token: Token;
    zapOutWith: ZapOutWith;
  }): Promise<{ simulateFn: (save: boolean) => Promise<TransactionOutcome>; forkId?: string }> {
    if (!withdrawArgs.options.slippage) {
      throw new SdkError("slippage needs to be specified for a zap", SdkError.NO_SLIPPAGE);
    }

    const { needsApproving, root, forkId } = await this.getZapOutApprovalData(withdrawArgs, zapOutWith);

    const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
      return this.zapOut(
        {
          ...withdrawArgs,
          underlyingTokenAddress,
          skipGasEstimate: needsApproving,
          options: { ...withdrawArgs.options, root, forkId, save },
        },
        zapOutWith
      );
    };

    return { simulateFn, forkId };
  }

  private async handleZapOutSimulation({ zapOutWith, token, withdrawArgs }: ZapOutSimulationArgs) {
    if (zapOutWith === "portalsZapOut" || zapOutWith === "widoZapOut") {
      const { simulateFn, forkId } = await this.getZapOutSimulationArgs({ withdrawArgs, token, zapOutWith });

      return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, forkId);
    }

    if (zapOutWith === "ftmApeZap") {
      throw new SdkError("ftmApeZap not implemented yet!");
    }

    throw new SdkError(`zapOutWith "${zapOutWith}" not supported yet!`);
  }
}
