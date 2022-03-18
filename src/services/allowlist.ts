import { BytesLike } from "@ethersproject/bytes";

import { ChainId } from "../chain";
import { ContractAddressId, ContractService, WrappedContract } from "../common";
import { Address } from "../types";

/**
 * [[AllowListService]] is used to interface with yearn's deployed AllowList contract. The purpose of it is to be able to
 * validate that all interactions that are about to be written to the blockchain follow the set of rules that the AllowList defines on chain.
 * It should be used to validate any transaction before it is written. For example, it can be used to check that an approval transaction that the sdk makes
 * is approving a token that is an underlying asset of a vault, and also that the first parameter in the approval transaction is the address of a valid yearn vault.
 * Similarly, for a deposit transaction, it can be used to check whether the vault is a valid yearn vault
 */
export class AllowListService<T extends ChainId> extends ContractService<T> {
  static abi = [
    "function validateCalldataByOrigin(string memory originName, address targetAddress, bytes calldata data) public view returns (bool)"
  ];
  static contractId = ContractAddressId.allowlist;

  /**
   * This is used by the AllowListFactory to resolve which set of rules are applicable to which organization
   */
  private static originName = "yearn.finance";

  get contract(): Promise<WrappedContract> {
    return this._getContract(AllowListService.abi, AllowListService.contractId, this.ctx);
  }

  /**
   * Uses yearn's on chain AllowList to verify whether the calldata being sent to the target contract by the sdk is valid. This should be used prior to any
   * write method, including token approvals. This method will raise an error if the parameters are not valid.
   * @param targetAddress The contract that is being interacted with e.g. for approving depositing usdc into a vault this would be usdc.
   *                      For depositing/withdrawing from a vault it'd be the vault contract itself
   * @param callData The data from the tx that should be validated. This should be from a tx that has been populated and is about to be sent
   */
  async validateCalldata(targetAddress?: Address, callData?: BytesLike): Promise<{ success: boolean; error?: string }> {
    if (!targetAddress) {
      return { success: false, error: "can't validate a tx that isn't targeting an address" };
    }

    if (!callData) {
      return { success: false, error: "can't validate a tx that has no call data" };
    }

    let contract;

    try {
      contract = await this.contract;
      if (!contract) throw new Error("Contract missing");
    } catch (e) {
      // temporary workaround after deprecating the `disableAllowlist` param
      // if allowlist has no onchain contract address, we skip validation altogether
      console.warn("AllowList on-chain contract address missing. Skipping validation...");
      return { success: true };
    }

    try {
      const valid = await contract.read.validateCalldataByOrigin(AllowListService.originName, targetAddress, callData);
      if (!valid) {
        return { success: false, error: "tx is not permitted by the allow list" };
      }

      return { success: true };
    } catch {
      return { success: false, error: "failed to read from the allow list whether the transaction is valid" };
    }
  }
}
