import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider, TransactionRequest } from "@ethersproject/providers";

import { ChainId } from "./chain";
import { AllowListService } from "./services/allowlist";
import { SdkError } from "./types";

export const extendJsonRpcProvider = (provider:JsonRpcProvider, allowList: AllowListService<ChainId>): JsonRpcProvider => {
  if(allowList) {
    const origSend = provider.send.bind(provider)

    provider.send = async (method: string, params: Array<any>): Promise<any> => {
      if (method !== 'eth_sendTransaction') {
        return origSend(method, params);
      }

      const dehexlifyTx = (transaction: { [key: string]: string }): { to?: string, data?: string } => {
        let result: { to?: string, data?: string } = {};

        if (!transaction.to) {
          throw new Error('no to set');
        }
        if (!transaction.data) {
          throw new Error('no data set');
        }

        console.log('this is the tx data', transaction.data)
        console.log('this is the tx to', transaction.to)
        result.data = transaction.data;
        result.to = transaction.to;

        return result;
      }

      const dehexlifiedTx = dehexlifyTx(params[0]);

      const validateTx = async (
        transaction: Deferrable<TransactionRequest>,
        allowList: AllowListService<ChainId>
      ): Promise<boolean> => {
        const [to, data] = await Promise.all([transaction.to, transaction.data]);
        return await allowList.validateCalldata(to, data).then(res => res.success);
      }
      const valid = await validateTx(dehexlifiedTx, allowList);
      if (valid) {
        throw new SdkError("transaction is not valid");
      }
      return origSend(method, params);
    }
  }
    // async send(method: string, params: Array<any>): Promise<any>  {
    //     if (method !== 'eth_sendTransaction' || !this.allowList) {
    //       return this.provider.send(method, params);
    //     }

    //     const dehexlifiedTx = this.dehexlifyTx(params[0]);

    //     debugger;
    //     const valid = await this.validateTx(dehexlifiedTx, this.allowList);
    //     if (valid) {
    //       throw new SdkError("transaction is not valid");
    //     }
    //     return this.provider.send(method, params);
    //   }
  return provider;
}
// export class ValidatedJsonRpcProvider extends JsonRpcProvider{
//   allowList?: AllowListService<ChainId>;

//   constructor(url: string, network: Networkish, allowList: AllowListService<ChainId>) {
//     super(url, network);
//     this.allowList = allowList;
//   }

//   dehexlifyTx(transaction: { [key: string]: string }): { to?: string, data?: string } {
//     let result: { to?: string, data?: string } = {};

//     if (!transaction.to) {
//       throw new Error('no to set');
//     }
//     if (!transaction.data) {
//       throw new Error('no data set');
//     }

//     console.log('this is the tx data', transaction.data)
//     console.log('this is the tx to', transaction.to)
//     result.data = transaction.data;
//     result.to = transaction.to;

//     return result;
//   }
//   async send(method: string, params: Array<any>): Promise<any>  {
//     if (method !== 'eth_sendTransaction' || !this.allowList) {
//       return super.send(method, params);
//     }

//     const dehexlifiedTx = this.dehexlifyTx(params[0]);

//     debugger;
//     const valid = await this.validateTx(dehexlifiedTx, this.allowList);
//     if (valid) {
//       throw new SdkError("transaction is not valid");
//     }
//     return super.send(method, params);
//   }

//   private async validateTx(
//     transaction: Deferrable<TransactionRequest>,
//     allowList: AllowListService<ChainId>
//   ): Promise<boolean> {
//     const [to, data] = await Promise.all([transaction.to, transaction.data]);
//     return await allowList.validateCalldata(to, data).then(res => res.success);
//   }
// }
