import { CowSdk, OrderKind } from "@cowprotocol/cow-sdk";

import { ChainId } from "../chain";
import { Service } from "../common";
import { Context } from "../context";
import { Address, Integer, SdkError, SimpleTransactionOutcome } from "../types";

const APP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export class CowSwapService extends Service {
  private cowSdk: CowSdk;

  constructor(chainId: ChainId, ctx: Context) {
    super(chainId, ctx);
    this.cowSdk = new CowSdk(chainId, { env: "staging" });
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
    const validTo = Math.floor(this.timeOneHourFromNow() / 1000);
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
    const validTo = Math.floor(this.timeOneHourFromNow() / 1000);
    const kind = OrderKind.SELL;
    const cowContext = {
      env: "staging",
      signer: this.ctx.provider.write.getSigner(accountAddress),
    };
    await this.cowSdk.updateContext(cowContext as any);

    const order = {
      kind,
      sellToken: sourceTokenAddress,
      buyToken: targetTokenAddress,
      sellAmount: sourceTokenAmount,
      buyAmount: targetTokenAmount,
      feeAmount: sourceTokenAmountFee,
      receiver: accountAddress,
      validTo,
      partiallyFillable: false,
      appData: APP_DATA,
    };

    const { signature, signingScheme } = await this.cowSdk.signOrder(order);

    if (!signature) throw new SdkError("Failed signing order");

    console.log(signature, signingScheme);

    const orderId = await this.cowSdk.cowApi.sendOrder({
      order: { ...order, signature, signingScheme },
      owner: accountAddress,
    });

    console.log(`https://explorer.cow.fi/orders/${orderId}`);

    return orderId;
  }

  private timeOneHourFromNow(): number {
    const ONE_HOUR = 1000 * 60 * 60;
    return new Date(Date.now() + ONE_HOUR).getTime();
  }
}
