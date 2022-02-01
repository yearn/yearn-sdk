import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider, JsonRpcSigner, TransactionRequest, TransactionResponse } from "@ethersproject/providers";

import { ChainId } from "./chain";
import { AllowListService } from "./services/allowlist";
import { SdkError } from "./types/common";

export class ValidatedJsonRpcSigner extends JsonRpcSigner {
  private allowList: AllowListService<ChainId>;

  constructor(
    constructorGuard: any,
    provider: JsonRpcProvider,
    allowList: AllowListService<ChainId>,
    addressOrIndex?: string | number
  ) {
    super(constructorGuard, provider, addressOrIndex);
    this.allowList = allowList;
  }

  async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
    const valid = await this.validateTx(transaction);
    if (!valid) {
      throw new SdkError("transaction is not valid");
    }
    return super.sendTransaction(transaction);
  }

  private async validateTx(transaction: Deferrable<TransactionRequest>): Promise<boolean> {
    const [to, data] = await Promise.all([transaction.to, transaction.data]);
    return await this.allowList.validateCalldata(to, data).then(res => res.success);
  }
}
