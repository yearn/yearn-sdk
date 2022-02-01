import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider, JsonRpcSigner, TransactionRequest } from "@ethersproject/providers";

import { ChainId } from "./chain";
import { AllowListService } from "./services/allowlist";
import { SdkError } from "./types/common";

const originalJsonRpcSignerSendTransaction = JsonRpcSigner.prototype.sendTransaction;
const origSigner = JsonRpcProvider.prototype.getSigner;

export function addValidationToProvider(provider: JsonRpcProvider, allowList: AllowListService<ChainId>) {
  const validateTx = async (transaction: Deferrable<TransactionRequest>) => {
    const [to, data] = await Promise.all([transaction.to, transaction.data]);
    return await allowList.validateCalldata(to, data).then(res => res.success);
  };

  provider.getSigner = (addressOrIndex?: string | number | undefined) => {
    const signer = origSigner.apply(provider, [addressOrIndex]);
    signer.sendTransaction = async (transaction: Deferrable<TransactionRequest>) => {
      const valid = await validateTx(transaction);
      if (!valid) {
        throw new SdkError("transaction is not valid");
      }
      return originalJsonRpcSignerSendTransaction.apply(signer, [transaction]);
    };
    return signer;
  };
}
