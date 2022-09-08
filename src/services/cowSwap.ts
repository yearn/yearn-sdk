import { CowSdk, OrderKind } from "@cowprotocol/cow-sdk";

import { ChainId } from "../chain";
import { Service } from "../common";
import { Context } from "../context";
import { Address, Integer, SdkError } from "../types";

const APP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export class CowSwapService extends Service {
  private cowSdk: CowSdk;

  constructor(chainId: ChainId, ctx: Context) {
    super(chainId, ctx);
    this.cowSdk = new CowSdk(chainId);
  }

  async deposit({
    vaultAddress,
    tokenAddress,
    minTargetAmount,
    accountAddress,
  }: {
    vaultAddress: Address;
    tokenAddress: Address;
    minTargetAmount: Integer;
    accountAddress: Address;
  }): Promise<string> {
    const ONE_HOUR = 1000 * 60 * 60;
    const validTo = Math.floor(new Date(Date.now() + ONE_HOUR).getTime() / 1000);
    const kind = OrderKind.BUY;

    const quoteResponse = await this.cowSdk.cowApi.getQuote({
      kind,
      sellToken: tokenAddress,
      buyToken: vaultAddress,
      buyAmountAfterFee: minTargetAmount,
      from: accountAddress,
      validTo,
      partiallyFillable: false,
      appData: APP_DATA,
    });

    console.log(quoteResponse);

    const { sellToken, buyToken, buyAmount, sellAmount, feeAmount, partiallyFillable, appData } = quoteResponse.quote;
    const order = {
      kind,
      sellToken,
      buyToken,
      buyAmount,
      sellAmount,
      feeAmount,
      receiver: accountAddress,
      validTo,
      partiallyFillable,
      appData,
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

  async withdraw({
    vaultAddress,
    tokenAddress,
    minTargetAmount,
    accountAddress,
  }: {
    vaultAddress: Address;
    tokenAddress: Address;
    minTargetAmount: Integer;
    accountAddress: Address;
  }): Promise<string> {
    const ONE_HOUR = 1000 * 60 * 60;
    const validTo = Math.floor(new Date(Date.now() + ONE_HOUR).getTime() / 1000);
    const kind = OrderKind.BUY;

    const quoteResponse = await this.cowSdk.cowApi.getQuote({
      kind,
      sellToken: vaultAddress,
      buyToken: tokenAddress,
      buyAmountAfterFee: minTargetAmount,
      from: accountAddress,
      validTo,
      partiallyFillable: false,
      appData: APP_DATA,
    });

    console.log(quoteResponse);

    const { sellToken, buyToken, buyAmount, sellAmount, feeAmount, partiallyFillable, appData } = quoteResponse.quote;
    const order = {
      kind,
      sellToken,
      buyToken,
      buyAmount,
      sellAmount,
      feeAmount,
      receiver: accountAddress,
      validTo,
      partiallyFillable,
      appData,
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
}
