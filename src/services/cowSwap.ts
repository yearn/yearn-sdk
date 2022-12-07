import { CowSdk, OrderKind, OrderMetaData } from "@cowprotocol/cow-sdk";

import { ChainId } from "../chain";
import { Service } from "../common";
import { Context } from "../context";
import { Address, Integer, SdkError, SimpleTransactionOutcome } from "../types";
import { poll, toBN } from "../utils";

const APP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
const TEN_MINUTES = 1000 * 60 * 10;

export class CowSwapService extends Service {
  private cowSdk: CowSdk;

  constructor(chainId: ChainId, ctx: Context) {
    super(chainId, ctx);
    this.cowSdk = new CowSdk(chainId);
  }

  async getExpectedTransactionOutcome({
    sourceTokenAddress,
    targetTokenAddress,
    sourceTokenAmount,
    accountAddress,
  }: {
    sourceTokenAddress: Address;
    targetTokenAddress: Address;
    sourceTokenAmount: Integer;
    accountAddress: Address;
  }): Promise<SimpleTransactionOutcome> {
    const validTo = Math.floor(this.timeFromNow(TEN_MINUTES) / 1000);
    const kind = OrderKind.SELL;

    const quoteResponse = await this.cowSdk.cowApi.getQuote({
      kind,
      sellToken: sourceTokenAddress,
      buyToken: targetTokenAddress,
      sellAmountBeforeFee: sourceTokenAmount,
      from: accountAddress,
      validTo,
      partiallyFillable: false,
      appData: APP_DATA,
    });

    const { buyAmount, feeAmount } = quoteResponse.quote;
    return {
      sourceTokenAddress,
      sourceTokenAmount,
      targetTokenAddress,
      targetTokenAmount: buyAmount,
      sourceTokenAmountFee: feeAmount,
    };
  }

  async sendOrder({
    sourceTokenAddress,
    targetTokenAddress,
    sourceTokenAmount,
    targetTokenAmount,
    sourceTokenAmountFee,
    accountAddress,
  }: {
    sourceTokenAddress: Address;
    targetTokenAddress: Address;
    sourceTokenAmount: Integer;
    targetTokenAmount: Integer;
    sourceTokenAmountFee: Integer;
    accountAddress: Address;
  }): Promise<string> {
    const validTo = Math.floor(this.timeFromNow(TEN_MINUTES) / 1000);
    const kind = OrderKind.SELL;
    const cowContext = {
      signer: this.ctx.provider.write.getSigner(accountAddress),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.cowSdk.updateContext(cowContext as any);

    const sellAmount = toBN(sourceTokenAmount).minus(sourceTokenAmountFee).toFixed(0);
    const order = {
      kind,
      sellToken: sourceTokenAddress,
      buyToken: targetTokenAddress,
      sellAmount,
      buyAmount: targetTokenAmount,
      feeAmount: sourceTokenAmountFee,
      receiver: accountAddress,
      validTo,
      partiallyFillable: false,
      appData: APP_DATA,
    };

    const { signature, signingScheme } = await this.cowSdk.signOrder(order);

    if (!signature) throw new SdkError("Failed signing order");

    const orderId = await this.cowSdk.cowApi.sendOrder({
      order: { ...order, signature, signingScheme },
      owner: accountAddress,
    });

    console.log(`https://explorer.cow.fi/orders/${orderId}`);

    return orderId;
  }

  async waitForOrderToFill({ orderId }: { orderId: string }) {
    const POLL_INTERVAL = 5000;
    const getOrderMetaData = async () => {
      const orderMetaData = await this.cowSdk.cowApi.getOrder(orderId);
      if (!orderMetaData) throw new Error("Order not found");
      return orderMetaData;
    };
    const isWaitingToFill = ({ status }: OrderMetaData) => {
      if (status === "fulfilled") return false;
      if (status === "open" || status === "presignaturePending") return true;

      throw new Error("Order failed");
    };

    return await poll(getOrderMetaData, isWaitingToFill, POLL_INTERVAL);
  }

  private timeFromNow(delta: number): number {
    return new Date(Date.now() + delta).getTime();
  }
}
