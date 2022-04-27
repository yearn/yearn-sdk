import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress, WethAddress, ZeroAddress } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import { SimulationExecutor, SimulationResponse } from "../simulationExecutor";
import {
  Address,
  DepositableVault,
  EthersError,
  Integer,
  PriceFetchingError,
  SdkError,
  SimulationOptions,
  Token,
  TransactionOutcome,
  ZapperError,
  ZapProtocol,
} from "../types";
import { toBN } from "../utils";
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
  vault: DepositableVault;
  vaultContract: VaultContract;
};

type ZapInSimulationDepositArgs = {
  zapInWith: ZapInWith;
  vault: DepositableVault;
  depositArgs: DepositArgs;
};

type DirectDepositSimulationArgs = {
  vaultContract: VaultContractType;
  vault: DepositableVault;
  depositArgs: DepositArgs;
  signer: JsonRpcSigner;
};

type ApprovalData = { approvalTransactionId?: string; forkId?: string };

type VaultContractType = PickleJarContract | YearnVaultContract;

type GetVaultArgs = {
  toVault: Address;
  vaultContract: VaultContractType;
};
import { getZapOutDetails, ZapOutWith } from "../zap";

type GetWithdrawApprovalData = {
  from: Address;
  fromVault: Address;
  options: SimulationOptions;
};

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
  private simulationExecutor = new SimulationExecutor(this.yearn.services.telegram, this.ctx);

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

    const vault = await this.getVault({ toVault, vaultContract });

    if (!vault) {
      throw new SdkError(`Could not get vault: ${toVault}`);
    }

    const token = await this.yearn.tokens.findByAddress(sellToken);

    if (!token) {
      throw new SdkError(`Could not find the token by address: ${sellToken}`);
    }

    const isUnderlyingToken = await this.isUnderlyingToken({ toVault, token });

    if (isUnderlyingToken) {
      return this.handleDirectSimulationDeposit({ depositArgs, vaultContract, vault, signer });
    }

    const { isZapInSupported, zapInWith } = getZapInDetails({ chainId: this.chainId, token, vault });

    if (isZapInSupported && zapInWith) {
      return this.handleZapInSimulationDeposit({ depositArgs, zapInWith, vault });
    }

    throw new SdkError(`Deposit of ${token.address} to ${toVault} is not supported`);
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

    const token = await this.yearn.tokens.findByAddress(from);

    if (!token) {
      throw new SdkError(`Could not find the token by address: ${from}`);
    }

    const { isZapOutSupported, zapOutWith } = getZapOutDetails({ chainId: this.chainId, token, vault });

    if (isZapOutSupported && zapOutWith) {
      return this.handleZapOutSimulation({ withdrawArgs, zapOutWith, token });
    }

    const underlyingToken = this.yearn.vaults.isUnderlyingToken(fromVault, toToken);

    if (!isZapOutSupported && !underlyingToken) {
      throw new SdkError(`Withdraw of ${from} from ${fromVault} is not supported`);
    }

    return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(
      (save: boolean): Promise<TransactionOutcome> => {
        return this.directWithdraw({ ...withdrawArgs, vaultContract, options: { ...options, save } });
      }
    );
  }

  private async getWithdrawApprovalData({ from, fromVault, options }: GetWithdrawApprovalData) {
    if (fromVault === EthAddress) {
      return { needsApproving: false };
    }

    try {
      const { isApproved } = await this.yearn.services.zapper.zapOutApprovalState(from, fromVault);

      if (isApproved) {
        return { needsApproving: false };
      }
    } catch (error) {
      throw new ZapperError("zap out approval state", ZapperError.ZAP_OUT_APPROVAL_STATE);
    }

    const forkId = await this.simulationExecutor.createFork();

    try {
      const zapApprovalTransaction = await this.yearn.services.zapper.zapOutApprovalTransaction(from, fromVault, "0");
      const { simulation } = await this.simulateZapApprovalTransaction(zapApprovalTransaction, {
        ...options,
        forkId,
      });
      return { needsApproving: true, root: simulation.id, forkId };
    } catch (error) {
      throw new ZapperError("zap out approval transaction", ZapperError.ZAP_OUT_APPROVAL);
    }
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
  }: {
    depositArgs: DepositArgs;
    vault: DepositableVault;
    skipGasEstimate: boolean;
  }): Promise<TransactionOutcome> {
    const zapToken = sellToken === EthAddress ? ZeroAddress : sellToken;

    if (!options.slippage) {
      throw new SdkError("slippage needs to be set", SdkError.NO_SLIPPAGE);
    }

    const zapProtocol = this.getZapProtocol({ vault: toVault });

    const zapInParams = await this.yearn.services.zapper
      .zapIn(from, zapToken, amount, toVault, options.gasPrice || "0", options.slippage, skipGasEstimate, zapProtocol)
      .catch(() => {
        throw new ZapperError("zap in", ZapperError.ZAP_IN);
      });

    const value = toBN(zapInParams.value).toFixed(0);

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

    const oracleToken = sellToken === EthAddress ? WethAddress : sellToken;
    const zapInAmountUsdc = toBN(
      await this.yearn.services.oracle.getNormalizedValueUsdc(oracleToken, amount).catch(() => {
        throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
      })
    );

    const conversionRate = amountReceivedUsdc.div(zapInAmountUsdc).toNumber();

    return {
      sourceTokenAddress: sellToken,
      sourceTokenAmount: amount,
      targetTokenAddress: zapInParams.buyTokenAddress,
      targetTokenAmount: tokensReceived,
      targetTokenAmountUsdc: amountReceivedUsdc.toFixed(0),
      targetUnderlyingTokenAddress: underlyingTokenAddress,
      targetUnderlyingTokenAmount: targetUnderlyingTokensReceived,
      conversionRate: conversionRate,
      slippage: 1 - conversionRate,
    };
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

    const result: TransactionOutcome = {
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

    return result;
  }

  private async zapOut({
    from,
    toToken,
    underlyingTokenAddress,
    amount,
    fromVault,
    skipGasEstimate,
    options,
  }: ZapOutArgs): Promise<TransactionOutcome> {
    if (!options.slippage) {
      throw new SdkError("slippage needs to be set", SdkError.NO_SLIPPAGE);
    }

    const zapToken = toToken === EthAddress ? ZeroAddress : toToken;
    const zapOutParams = await this.yearn.services.zapper
      .zapOut(from, zapToken, amount, fromVault, "0", options.slippage, skipGasEstimate)
      .catch(() => {
        throw new ZapperError("error zapping out", ZapperError.ZAP_OUT);
      });

    if (!skipGasEstimate) {
      options.gasLimit = zapOutParams.gas;
    }

    const tokensReceived = await (async (): Promise<string> => {
      if (zapToken === ZeroAddress) {
        const response: SimulationResponse = await this.simulationExecutor.makeSimulationRequest(
          from,
          zapOutParams.to,
          zapOutParams.data,
          options,
          zapOutParams.value
        );
        return toBN(response.transaction.transaction_info.call_trace.output).toFixed(0);
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
    const zapOutAmountUsdc = await this.yearn.services.oracle
      .getNormalizedValueUsdc(oracleToken, tokensReceived)
      .catch(() => {
        throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
      });
    const soldAssetAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(fromVault, amount).catch(() => {
      throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
    });

    const conversionRate = toBN(zapOutAmountUsdc).div(toBN(soldAssetAmountUsdc)).toNumber();

    const result: TransactionOutcome = {
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

    return result;
  }

  private shouldUsePartnerService(vault: Address): boolean {
    return !!this.yearn.services.partner?.isAllowed(vault);
  }

  private async getZapperZapInApprovalData({
    sellToken,
    from,
    toVault,
    options,
  }: DepositArgs): Promise<{ needsApproving: boolean } & ApprovalData> {
    if (sellToken === EthAddress) {
      return { needsApproving: false };
    }

    const zapProtocol = this.getZapProtocol({ vault: toVault });

    const isApprovalNeeded = await this.yearn.services.zapper
      .zapInApprovalState(from, sellToken, zapProtocol)
      .then((state) => !state.isApproved)
      .catch(() => {
        throw new ZapperError("approval state", ZapperError.ZAP_IN_APPROVAL_STATE);
      });

    if (!isApprovalNeeded) {
      return { needsApproving: false };
    }

    const forkId = await this.simulationExecutor.createFork();

    const approvalTransactionId = await this.yearn.services.zapper
      .zapInApprovalTransaction(from, sellToken, "0", zapProtocol)
      .catch(() => {
        throw new ZapperError("approval", ZapperError.ZAP_IN_APPROVAL);
      })
      .then(async ({ from, to, data }) => {
        return this.simulationExecutor.makeSimulationRequest(from, to, data, { ...options, forkId, save: true });
      })
      .then((res) => res.simulation.id);

    return {
      needsApproving: true,
      approvalTransactionId,
      forkId,
    };
  }

  private async getZapperZapInSimulationArgs({
    depositArgs,
    vault,
  }: {
    depositArgs: DepositArgs;
    vault: DepositableVault;
  }): Promise<{ simulateFn: (save: boolean) => Promise<TransactionOutcome>; forkId?: string }> {
    if (!depositArgs.options.slippage) {
      throw new SdkError("slippage needs to be specified for a zap", SdkError.NO_SLIPPAGE);
    }

    const { needsApproving, approvalTransactionId, forkId } = await this.getZapperZapInApprovalData(depositArgs);

    const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
      return this.zapIn({
        depositArgs: {
          ...depositArgs,
          options: { ...depositArgs.options, forkId, save, root: approvalTransactionId },
        },
        vault,
        skipGasEstimate: needsApproving,
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
    const zapProtocol = this.getZapProtocol({ vault: toVault });

    return zapProtocol === ZapProtocol.PICKLE
      ? new PickleJarContract(toVault, signer)
      : new YearnVaultContract(toVault, signer);
  }

  private async handleZapInSimulationDeposit({ zapInWith, vault, depositArgs }: ZapInSimulationDepositArgs) {
    if (zapInWith === "zapperZapIn") {
      const { simulateFn, forkId } = await this.getZapperZapInSimulationArgs({ depositArgs, vault });

      return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, forkId);
    }

    if (zapInWith === "ftmApeZap") {
      throw new SdkError("ftmApeZap not implemented yet!");
    }

    throw new SdkError(`zapInWith "${zapInWith}" not supported yet!`);
  }

  private async isUnderlyingToken({ toVault, token }: { toVault: Address; token: Token }): Promise<boolean> {
    if (PickleJars.includes(toVault)) {
      return false;
    }

    return this.yearn.vaults.isUnderlyingToken(toVault, token.address);
  }

  private async getVault({ toVault, vaultContract }: GetVaultArgs): Promise<DepositableVault> {
    const zapProtocol = this.getZapProtocol({ vault: toVault });

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
        address: toVault,
        token: "0x9461173740d27311b176476fa27e94c681b1ea6b",
        decimals: decimals.toString(),
        metadata: {
          zapInWith: "zapperZapIn",
          pricePerShare: pricePerShare.toString(),
        },
      };
    }

    const [vault] = await this.yearn.vaults.get([toVault]);

    return vault;
  }

  private getZapProtocol({ vault }: { vault: Address }): ZapProtocol {
    return PickleJars.includes(vault) ? ZapProtocol.PICKLE : ZapProtocol.YEARN;
  }

  private async getZapperZapOutSimulationArgs({
    withdrawArgs,
    token: { address: underlyingTokenAddress },
  }: {
    withdrawArgs: WithdrawArgs;
    token: Token;
  }): Promise<{ simulateFn: (save: boolean) => Promise<TransactionOutcome>; forkId?: string }> {
    if (!withdrawArgs.options.slippage) {
      throw new SdkError("slippage needs to be specified for a zap", SdkError.NO_SLIPPAGE);
    }

    const { needsApproving, root, forkId } = await this.getWithdrawApprovalData(withdrawArgs);

    const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
      return this.zapOut({
        ...withdrawArgs,
        underlyingTokenAddress,
        skipGasEstimate: needsApproving,
        options: { ...withdrawArgs.options, root, forkId, save },
      });
    };

    return { simulateFn, forkId };
  }

  private async handleZapOutSimulation({ zapOutWith, token, withdrawArgs }: ZapOutSimulationArgs) {
    if (zapOutWith === "zapperZapOut") {
      const { simulateFn, forkId } = await this.getZapperZapOutSimulationArgs({ withdrawArgs, token });

      return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, forkId);
    }

    if (zapOutWith === "ftmApeZap") {
      throw new SdkError("ftmApeZap not implemented yet!");
    }

    throw new SdkError(`zapOutWith "${zapOutWith}" not supported yet!`);
  }
}
