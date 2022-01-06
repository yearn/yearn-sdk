import { BytesLike } from "@ethersproject/bytes";
import { TransactionRequest } from "@ethersproject/providers";

import { ChainId } from "../chain";
import { ContractService } from "../common";
import { Context } from "../context";
import { Address, SdkError } from "../types/common";

/**
 * [[AllowListService]] is used to interface with yearn's deployed AllowList contract. The purpose of it is to be able to
 * validate that all interactions that are about to be written to the blockchain follow the set of rules that the AllowList defines on chain.
 * It should be used to validate any transaction before it is written. For example, it can be used to check that an approval transaction that the sdk makes
 * is approving a token that is an underlying asset of a vault, and also that the first parameter in the approval transaction is the address of a valid yearn vault.
 * Similiarly, for a deposit transaction, it can be used to check whether the vault is a valid yearn vault
 */
export class AllowListService<T extends ChainId> extends ContractService<T> {
  static abi = ["function validateCalldata(string memory, targetAddress, data) public view returns (bool)"];

  /**
   * This is used by the AllowListFactory to resolve which set of rules are applicable to which organization
   */
  private static originName = "yearn.finance";

  /**
   * Get most up-to-date address of the Allow List Factory contract for a particular chain id
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

  /**
   * Uses yearn's on chain AllowList to verify whether the transaction being sent by the sdk is valid. This should be used prior to writing any transaction,
   * including token approvals. This method will raise an error if the transaction is not valid.
   * @param tx The transaction that is about to be written to the network
   */
  async validateTx(tx: TransactionRequest) {
    this.validateCalldata(tx.to, tx.data);
  }

  /**
   * Uses yearn's on chain AllowList to verify whether the calldata being sent to the target contract by the sdk is valid. This should be used prior to any
   * write method, including token approvals. This method will raise an error if the parameters are not valid.
   * @param targetAddress The contract that is being interacted with e.g. for approving depositing usdc into a vault this would be usdc.
   *                      For depositing/withdrawing from a vault it'd be the vault contract itself
   * @param callData The data from the tx that should be validated. This should be from a tx that has been populated and is about to be sent
   */
  async validateCalldata(targetAddress: Address | undefined, callData: BytesLike | undefined) {
    if (!targetAddress) {
      throw new SdkError("can't validate a tx that isn't targeting an address");
    }
    if (!callData) {
      throw new SdkError("can't validate a tx that has no call data");
    }

    try {
      const valid = await this.contract.read.validateCalldata(AllowListService.originName, targetAddress, callData);
      if (!valid) {
        throw new SdkError("tx is not permitted by the allow list");
      }
    } catch {
      throw new SdkError("tx is not permitted by the allow list");
    }
  }
}
