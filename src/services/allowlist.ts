import { ChainId } from "../chain";
import { ContractService } from "../common";
import { BytesLike } from "@ethersproject/bytes";
import { TransactionRequest } from "@ethersproject/providers";
import { Address, SdkError } from "../types/common";
import { Context } from "../context";

export class AllowListService<T extends ChainId> extends ContractService<T> {
  static abi = ["function validateCalldata(string memory, targetAddress, data) public view returns (bool)"];

  /**
   * Get most up-to-date address of the Allow List Factory contract for a particular chain
   * id.
   * @param chainId
   * @returns address
   */
  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0xef01bC08cf155098bDa7A2efBC7CceF632D03440";
      case 250:
      case 42161:
        throw new SdkError("Not yet implemented for this chain");
    }
  }

  constructor(chainId: T, ctx: Context) {
    super(ctx.addresses.allowList ?? AllowListService.addressByChain(chainId), chainId, ctx);
  }

  async validateTx(tx: TransactionRequest) {
    this.validateCalldata(tx.to, tx.data);
  }

  async validateCalldata(targetAddress: Address | undefined, callData: BytesLike | undefined) {
    if (!targetAddress) {
      throw new SdkError("can't validate a tx that isn't targeting an address");
    }
    if (!callData) {
      throw new SdkError("can't validate a tx that has no call data");
    }

    try {
      const valid = await this.contract.read.validateCalldata("yearn.finance", targetAddress, callData);
      if (!valid) {
        throw new SdkError("tx is not permitted by the allow list");
      }
    } catch {
      throw new SdkError("tx is not permitted by the allow list");
    }
  }
}
