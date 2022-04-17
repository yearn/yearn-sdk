import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";
import BigNumber from "bignumber.js";

import { ChainId, isEthereum, isFantom } from "../chain";
import { ServiceInterface } from "../common";
import { EthAddress, WethAddress, ZeroAddress } from "../helpers";
import { PickleJars } from "../services/partners/pickle";
import { SimulationExecutor, SimulationResponse } from "../simulationExecutor";
import { Address, EthersError, Integer, PriceFetchingError, SdkError, ZapperError, ZapProtocol } from "../types";
import { SimulationOptions, TransactionOutcome } from "../types/custom/simulation";
import { PickleJarContract, VaultContract, YearnVaultContract } from "../vault";

type DepositProps = {
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

    if (underlyingToken !== sellToken) {
      const { simulateFn, forkId } = await this.getZapSimulationArgs({ depositProps, underlyingToken, vaultContract });
      return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, forkId);
    }

    // TODO: Handle when it's not zapping

    const { approvalTransactionId, forkId } = await this.getApprovalData({ depositProps, signer });

    const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
      const txOptions: SimulationOptions = { ...options, forkId, save, root: approvalTransactionId };
      return this.directDeposit({ depositProps, vaultContract, options: txOptions });
    };

    return this.simulationExecutor.executeSimulationWithReSimulationOnFailure(simulateFn, forkId);
  }

  private async getZapSimulationArgs({
    depositProps,
    underlyingToken,
    vaultContract,
  }: {
    depositProps: DepositProps;
    underlyingToken: string;
    vaultContract: PickleJarContract | YearnVaultContract;
  }): Promise<{ simulateFn: (save: boolean) => Promise<TransactionOutcome>; forkId?: string }> {
    const { toVault, options } = depositProps;

    if (!options.slippage) {
      throw new SdkError("slippage needs to be specified for a zap", SdkError.NO_SLIPPAGE);
    }

    const { needsApproving, approvalTransactionId, forkId } = await this.getZappingApprovalData({
      depositProps,
    });

    if (isEthereum(this.chainId)) {
      const simulateFn = (save: boolean): Promise<TransactionOutcome> => {
        const txOptions: SimulationOptions = { ...options, forkId, save, root: approvalTransactionId };
        return this.zapIn({
          depositProps: {
            ...depositProps,
            options: txOptions,
          },
          underlyingToken,
          vaultContract,
          zapProtocol: this.getZapProtocol({ toVault }),
          skipGasEstimate: needsApproving,
        });
      };
      return { simulateFn, forkId };
    }

    throw new SdkError(
      `Unsupported zapping for chainId: ${this.chainId}. Token supported options: ${options.token?.supported}`
    );
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
    const isUsingPartnerService = this.shouldUsePartnerService(vault);
    const partnerServiceId = await this.yearn.services.partner?.address;
    const addressToApprove = (isUsingPartnerService && partnerServiceId) || vault;
    const encodedInputData = tokenContract.interface.encodeFunctionData("approve", [addressToApprove, amount]);
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
    const isUsingPartnerService = this.shouldUsePartnerService(vault);
    const addressToCheck = (isUsingPartnerService && this.yearn.services.partner?.address) || vault;
    const result = await contract.allowance(from, addressToCheck).catch(() => {
      "deposit needs approving";
    });
    return new BigNumber(result.toString()).lt(new BigNumber(amount));
  }

  private async directDeposit({
    depositProps,
    vaultContract,
    options,
  }: {
    depositProps: DepositProps;
    vaultContract: VaultContract;
    options: SimulationOptions;
  }): Promise<TransactionOutcome> {
    const { toVault, amount, from, sellToken } = depositProps;

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

    const result: TransactionOutcome = {
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

    return result;
  }

  private async zapIn({
    depositProps,
    underlyingToken,
    vaultContract,
    zapProtocol,
    skipGasEstimate,
  }: {
    depositProps: DepositProps;
    underlyingToken: Address;
    vaultContract: VaultContract;
    zapProtocol: ZapProtocol;
    skipGasEstimate: boolean;
  }): Promise<TransactionOutcome> {
    const { sellToken, from, amount, toVault, options } = depositProps;

    const zapToken = sellToken === EthAddress ? ZeroAddress : sellToken;

    if (!options.slippage) {
      throw new SdkError("slippage needs to be set", SdkError.NO_SLIPPAGE);
    }

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

    const tokensReceived = await this.simulationExecutor.simulateVaultInteraction(
      from,
      zapInParams.to,
      zapInParams.data,
      toVault,
      options,
      value
    );

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

    const result: TransactionOutcome = {
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

  private async getZappingApprovalData({ depositProps }: { depositProps: DepositProps }): Promise<ZappingApprovalData> {
    const { sellToken, from, toVault, options } = depositProps;

    if (isEthereum(this.chainId) && sellToken === EthAddress) {
      return { needsApproving: false };
    }

    const { token } = options;

    if (isEthereum(this.chainId) && token?.supported.zapperZapIn) {
      const isApprovalNeeded = await this.yearn.services.zapper
        .zapInApprovalState(from, sellToken, this.getZapProtocol({ toVault }))
        .then((state) => !state.isApproved)
        .catch(() => {
          throw new ZapperError("approval state", ZapperError.ZAP_IN_APPROVAL_STATE);
        });

      if (!isApprovalNeeded) {
        return { needsApproving: false };
      }

      const forkId = await this.simulationExecutor.createFork();

      const approvalTransactionId = await this.yearn.services.zapper
        .zapInApprovalTransaction(from, sellToken, "0", this.getZapProtocol({ toVault }))
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

    if (isFantom(this.chainId) && token?.supported.ftmApeZap) {
      // TODO
      throw new Error("Fantom zap in not implemented!");
    }

    throw new SdkError(`Unsupported zapping: ${token?.supported}`);
  }

  private async getApprovalData({
    depositProps,
    signer,
  }: {
    depositProps: DepositProps;
    signer: JsonRpcSigner;
  }): Promise<ApprovalData> {
    const { from, sellToken, toVault, amount, options } = depositProps;

    const needsApproving = await this.depositNeedsApproving(from, sellToken, toVault, amount, signer);

    const forkId = needsApproving ? await this.simulationExecutor.createFork() : undefined;

    const approvalTransactionId = needsApproving
      ? await this.approve(from, sellToken, amount, toVault, options)
      : undefined;

    return {
      approvalTransactionId,
      forkId,
    };
  }

  private getZapProtocol({ toVault }: { toVault: string }): ZapProtocol {
    return PickleJars.includes(toVault) ? ZapProtocol.PICKLE : ZapProtocol.YEARN;
  }

  private getVaultContract({
    toVault,
    signer,
  }: {
    toVault: string;
    signer: JsonRpcSigner;
  }): PickleJarContract | YearnVaultContract {
    if (this.getZapProtocol({ toVault }) === ZapProtocol.PICKLE) {
      return new PickleJarContract(toVault, signer);
    }

    return new YearnVaultContract(toVault, signer);
  }
}
