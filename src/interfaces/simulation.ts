import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { ChainId, isEthereum } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress, WethAddress, ZeroAddress } from "../helpers";
import { SimulationExecutor, SimulationResponse } from "../simulationExecutor";
import { Address, EthersError, Integer, PriceFetchingError, SdkError, ZapperError, ZapProtocol } from "../types";
import { SimulationOptions, TransactionOutcome } from "../types/custom/simulation";
import { PickleJarContract, VaultContract, YearnVaultContract } from "../vault";
import { checkZappability } from "../zappable";

export type DepositProps = {
  from: Address;
  sellToken: Address;
  amount: Integer;
  toVault: Address;
  options: SimulationOptions;
};

type ApprovalData = { approvalTransactionId?: string; forkId?: string };

type ZappingApprovalData = { needsApproving: boolean } & ApprovalData;

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

    const vaultContract = this.getVaultContract({ toVault, signer });

    const underlyingToken = await vaultContract.token().catch(() => {
      throw new EthersError("failed to fetch token", EthersError.FAIL_TOKEN_FETCH);
    });

    const depositProps = { from, sellToken, amount, toVault, options };

    const { isZappable, zappableType } = checkZappability({ chainId: this.chainId, token: options.token });

    if (isZappable && underlyingToken !== sellToken) {
      switch (zappableType) {
        case "zapper": {
          const { simulateFn, forkId } = await this.getZapperZapInSimulationArgs({
            depositProps,
            underlyingToken,
            vaultContract,
          });
          return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, forkId);
        }
        case "ftmApeZap": {
          throw new SdkError("ftmApeZap not implemented yet!");
        }
        default:
          throw new SdkError(`zappableType "${zappableType}" not supported yet!`);
      }
    }

    // TODO: Handle when it's not zapping

    const { approvalTransactionId, forkId } = await this.getApprovalData({ depositProps, signer });

    const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
      const txOptions: SimulationOptions = { ...options, forkId, save, root: approvalTransactionId };
      return this.directDeposit({ depositProps, vaultContract, options: txOptions });
    };

    return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, forkId);
  }

  private async directDeposit({
    depositProps: { toVault, amount, from, sellToken },
    vaultContract,
    options,
  }: {
    depositProps: DepositProps;
    vaultContract: VaultContract;
    options: SimulationOptions;
  }): Promise<TransactionOutcome> {
    const encodedInputData = await (this.shouldUsePartnerService(toVault)
      ? this.yearn.services.partner?.encodeDeposit(toVault, amount)
      : vaultContract.encodeDeposit(amount));

    if (!encodedInputData) {
      throw new Error("directDeposit#encodeDeposit failed");
    }

    const partnerAddress = await this.yearn.services.partner?.address;
    const addressToDeposit = (this.shouldUsePartnerService(toVault) && partnerAddress) || toVault;

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

    const [decimals, pricePerShare] = await Promise.all([
      vaultContract.decimals().catch(() => {
        throw new EthersError("no decimals", EthersError.NO_DECIMALS);
      }),
      vaultContract.pricePerShare().catch(() => {
        throw new EthersError("no price per share", EthersError.NO_PRICE_PER_SHARE);
      }),
    ]);

    const targetUnderlyingTokensReceived = new BigNumber(tokensReceived)
      .div(new BigNumber(10).pow(decimals))
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

  private async depositNeedsApproving({
    depositProps: { from, sellToken, amount, toVault },
    signer,
  }: {
    depositProps: DepositProps;
    signer: JsonRpcSigner;
  }): Promise<boolean> {
    const TokenAbi = ["function allowance(address owner, address spender) view returns (uint256)"];
    const contract = new Contract(sellToken, TokenAbi, signer);
    const isUsingPartnerService = this.shouldUsePartnerService(toVault);
    const addressToCheck = (isUsingPartnerService && this.yearn.services.partner?.address) || toVault;
    const result = await contract.allowance(from, addressToCheck).catch(() => {
      "deposit needs approving";
    });
    return new BigNumber(result.toString()).lt(new BigNumber(amount));
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
        throw new SdkError("slippage needs to be specified for a zap", SdkError.NO_SLIPPAGE);
      }
      let needsApproving: boolean;

      if (fromVault === EthAddress) {
        needsApproving = false;
      } else {
        needsApproving = await this.yearn.services.zapper
          .zapOutApprovalState(from, fromVault)
          .then((state) => !state.isApproved)
          .catch(() => {
            throw new ZapperError("zap out approval state", ZapperError.ZAP_OUT_APPROVAL_STATE);
          });
      }

      forkId = needsApproving ? await this.simulationExecutor.createFork() : undefined;
      options.forkId = forkId;
      const approvalSimulationId = needsApproving
        ? await this.yearn.services.zapper
            .zapOutApprovalTransaction(from, fromVault, "0")
            .catch(() => {
              throw new ZapperError("zap out approval transaction", ZapperError.ZAP_OUT_APPROVAL);
            })
            .then(async ({ from, to, data }) => {
              return this.simulationExecutor.makeSimulationRequest(from, to, data, { ...options, save: true });
            })
            .then((res) => res.simulation.id)
        : undefined;

      options.root = approvalSimulationId;

      simulateWithdrawal = (save: boolean): Promise<TransactionOutcome> => {
        options.save = save;
        return this.zapOut(from, toToken, underlyingToken, amount, fromVault, needsApproving, options);
      };
    } else {
      simulateWithdrawal = (save: boolean): Promise<TransactionOutcome> => {
        options.save = save;
        return this.directWithdraw(from, toToken, amount, fromVault, vaultContract, options);
      };
    }
    return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateWithdrawal, forkId);
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

  private async zapIn({
    depositProps,
    underlyingToken,
    vaultContract,
    skipGasEstimate,
  }: {
    depositProps: DepositProps;
    underlyingToken: Address;
    vaultContract: VaultContract;
    skipGasEstimate: boolean;
  }): Promise<TransactionOutcome> {
    const { sellToken, from, amount, toVault, options } = depositProps;

    const zapToken = sellToken === EthAddress ? ZeroAddress : sellToken;

    if (!options.slippage) {
      throw new SdkError("slippage needs to be set", SdkError.NO_SLIPPAGE);
    }

    const zapProtocol = this.yearn.services.zapper.getZapProtocol({ vault: toVault });

    const zapInParams = await this.yearn.services.zapper
      .zapIn(from, zapToken, amount, toVault, options.gasPrice || "0", options.slippage, skipGasEstimate, zapProtocol)
      .catch(() => {
        throw new ZapperError("zap in", ZapperError.ZAP_IN);
      });

    const value = new BigNumber(zapInParams.value).toFixed(0);

    options.gasPrice = options.gasPrice || zapInParams.gasPrice;
    if (!skipGasEstimate) {
      options.gasLimit = zapInParams.gas;
    }

    const [decimals, pricePerShare] = await Promise.all([
      vaultContract.decimals().catch(() => {
        throw new EthersError("no decimals", EthersError.NO_DECIMALS);
      }),
      vaultContract.pricePerShare().catch(() => {
        throw new EthersError("no price per share", EthersError.NO_PRICE_PER_SHARE);
      }),
    ]);

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(
      from,
      zapInParams.to,
      zapInParams.data,
      toVault,
      options,
      value
    );

    const targetUnderlyingTokensReceived = new BigNumber(tokensReceived)
      .div(new BigNumber(10).pow(decimals))
      .multipliedBy(pricePerShare)
      .toFixed(0);

    let amountReceivedUsdc: BigNumber;

    switch (zapProtocol) {
      case ZapProtocol.YEARN:
        amountReceivedUsdc = await this.yearn.services.oracle
          .getNormalizedValueUsdc(toVault, tokensReceived)
          .then((price) => new BigNumber(price))
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
            .then((usdc) => new BigNumber(usdc))
        )
          .dividedBy(new BigNumber(10).pow(decimals))
          .multipliedBy(new BigNumber(tokensReceived));
        break;
    }

    const oracleToken = sellToken === EthAddress ? WethAddress : sellToken;
    const zapInAmountUsdc = new BigNumber(
      await this.yearn.services.oracle.getNormalizedValueUsdc(oracleToken, amount).catch(() => {
        throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
      })
    );

    const conversionRate = amountReceivedUsdc.div(new BigNumber(zapInAmountUsdc)).toNumber();

    return {
      sourceTokenAddress: sellToken,
      sourceTokenAmount: amount,
      targetTokenAddress: zapInParams.buyTokenAddress,
      targetTokenAmount: tokensReceived,
      targetTokenAmountUsdc: amountReceivedUsdc.toFixed(0),
      targetUnderlyingTokenAddress: underlyingToken,
      targetUnderlyingTokenAmount: targetUnderlyingTokensReceived,
      conversionRate: conversionRate,
      slippage: 1 - conversionRate,
    };
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
    const zapOutAmountUsdc = await this.yearn.services.oracle
      .getNormalizedValueUsdc(oracleToken, tokensReceived)
      .catch(() => {
        throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
      });
    const soldAssetAmountUsdc = await this.yearn.services.oracle.getNormalizedValueUsdc(fromVault, amount).catch(() => {
      throw new PriceFetchingError("error fetching price", PriceFetchingError.FETCHING_PRICE_ORACLE);
    });

    const conversionRate = new BigNumber(zapOutAmountUsdc).div(new BigNumber(soldAssetAmountUsdc)).toNumber();

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

  private shouldUsePartnerService(vault: string): boolean {
    return !!this.yearn.services.partner?.isAllowed(vault);
  }

  private async getZapperZapInApprovalData({
    sellToken,
    from,
    toVault,
    options,
  }: DepositProps): Promise<ZappingApprovalData> {
    if (!isEthereum(this.chainId)) {
      throw new SdkError(`Zapper unsupported for chainId: ${this.chainId}`);
    }

    if (sellToken === EthAddress) {
      return { needsApproving: false };
    }

    const { token } = options;

    if (!token?.supported.zapperZapIn) {
      throw new SdkError(`Zap in unsupported: ${token?.supported}`);
    }

    const zapProtocol = this.yearn.services.zapper.getZapProtocol({ vault: toVault });

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
        return this.simulationExecutor.makeSimulationRequest(from, to, data, { ...options, save: true });
      })
      .then((res) => res.simulation.id);

    return {
      needsApproving: true,
      approvalTransactionId,
      forkId,
    };
  }

  private async getZapperZapInSimulationArgs({
    depositProps,
    underlyingToken,
    vaultContract,
  }: {
    depositProps: DepositProps;
    underlyingToken: string;
    vaultContract: PickleJarContract | YearnVaultContract;
  }): Promise<{ simulateFn: (save: boolean) => Promise<TransactionOutcome>; forkId?: string }> {
    if (!isEthereum(this.chainId)) {
      throw new SdkError(`Zapper unsupported for chainId: ${this.chainId}`);
    }

    if (!depositProps.options.slippage) {
      throw new SdkError("slippage needs to be specified for a zap", SdkError.NO_SLIPPAGE);
    }

    const { needsApproving, approvalTransactionId, forkId } = await this.getZapperZapInApprovalData(depositProps);

    const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
      return this.zapIn({
        depositProps: {
          ...depositProps,
          options: { ...depositProps.options, forkId, save, root: approvalTransactionId },
        },
        underlyingToken,
        vaultContract,
        skipGasEstimate: needsApproving,
      });
    };

    return { simulateFn, forkId };
  }

  private async approve({ from, sellToken, amount, toVault, options }: DepositProps): Promise<string> {
    const TokenAbi = ["function approve(address spender, uint256 amount) returns (bool)"];
    const signer = this.ctx.provider.write.getSigner(from);
    const tokenContract = new Contract(sellToken, TokenAbi, signer);
    const isUsingPartnerService = this.shouldUsePartnerService(toVault);
    const partnerServiceId = await this.yearn.services.partner?.address;
    const addressToApprove = (isUsingPartnerService && partnerServiceId) || toVault;
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
    depositProps,
    signer,
  }: {
    depositProps: DepositProps;
    signer: JsonRpcSigner;
  }): Promise<ApprovalData> {
    if (!(await this.depositNeedsApproving({ depositProps, signer }))) {
      return {};
    }

    return {
      approvalTransactionId: await this.approve(depositProps),
      forkId: await this.simulationExecutor.createFork(),
    };
  }

  private getVaultContract({
    toVault,
    signer,
  }: {
    toVault: string;
    signer: JsonRpcSigner;
  }): PickleJarContract | YearnVaultContract {
    if (this.yearn.services.zapper.getZapProtocol({ vault: toVault }) === ZapProtocol.PICKLE) {
      return new PickleJarContract(toVault, signer);
    }

    return new YearnVaultContract(toVault, signer);
  }
}
