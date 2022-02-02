import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider, JsonRpcSigner, TransactionRequest } from "@ethersproject/providers";

import { ChainId } from "./chain";
import { AllowListService } from "./services/allowlist";
import { SdkError } from "./types/common";
// import { ValidatedJsonRpcSigner } from "./validatedSigner";

const originalJsonRpcSignerSendTransaction = JsonRpcSigner.prototype.sendTransaction;

export class ValidatedJsonRpcProvider extends JsonRpcProvider {
  allowList?: AllowListService<ChainId>;

  // constructor(url: string, network: Networkish, allowList: AllowListService<ChainId>) {
  //   super(url, network);
  //   this.allowList = allowList;
  // }

  getSigner(addressOrIndex?: string | number): JsonRpcSigner {
    if (this.allowList) {
      const signer = super.getSigner(addressOrIndex);
      signer.sendTransaction = async (transaction: Deferrable<TransactionRequest>) => {
        if (this.allowList) {
          const valid = await this.validateTx(transaction, this.allowList);
          if (valid) {
            throw new SdkError("transaction is not valid");
          }
        }
        return originalJsonRpcSignerSendTransaction.apply(signer, [transaction]);
      };
      return signer;
    } else {
      return super.getSigner(addressOrIndex);
    }
  }

  private validateTx = async (transaction: Deferrable<TransactionRequest>, allowList: AllowListService<ChainId>) => {
    const [to, data] = await Promise.all([transaction.to, transaction.data]);
    return await allowList.validateCalldata(to, data).then(res => res.success);
  };
}
