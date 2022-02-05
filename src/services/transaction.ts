import { Deferrable } from "@ethersproject/properties";
import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";

import { ChainId } from "../chain";
import { Service } from "../common";
import { Context } from "../context";
import { SdkError } from "../types/common";
import { AllowListService } from "./allowlist";

export class TransactionService<T extends ChainId> extends Service {
  private allowListService?: AllowListService<T>;

  constructor(chainId: T, ctx: Context, allowListService?: AllowListService<T>) {
    super(chainId, ctx);
    this.allowListService = allowListService;
  }

  async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
    const valid = await this.validateTx(transaction);
    if (!valid) {
      throw new SdkError("transaction is not valid");
    }
    const signer = this.ctx.provider.write.getSigner();
    return signer.sendTransaction(transaction);
  }

  private async validateTx(transaction: Deferrable<TransactionRequest>): Promise<boolean> {
    if (!this.allowListService) {
      return Promise.resolve(true);
    }

    const [to, data] = await Promise.all([transaction.to, transaction.data]);
    return await this.allowListService.validateCalldata(to, data).then(res => res.success);
  }
}
