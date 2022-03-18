import { CallOverrides, PopulatedTransaction } from "@ethersproject/contracts";

import { ChainId } from "../chain";
import { ContractAddressId, ContractService, WrappedContract } from "../common";
import { Context } from "../context";
import { ZeroAddress } from "../helpers";
import { AddressProvider } from "./addressProvider";

const YVECRV = "0xc5bDdf9843308380375a611c18B50Fb9341f502A";
const PSLPYVBOOSTETH = "0xCeD67a187b923F0E5ebcc77C7f2F7da20099e378";

/**
 * [[PartnerService]] provides access to yearns partner contract.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */
export class PartnerService<T extends ChainId> extends ContractService<T> {
  static abi = ["function deposit(address vault, address partnerId, uint256 amount) external returns (uint256)"];
  static IGNORED_ADDRESSES = [YVECRV, PSLPYVBOOSTETH];
  partnerId: string;
  static contractId = ContractAddressId.partner;

  get contract(): Promise<WrappedContract> {
    return this._getContract(PartnerService.abi, PartnerService.contractId, this.ctx);
  }

  get address(): Promise<string | undefined> {
    return (async (): Promise<string | undefined> => {
      const partnerAddress = await this.addressProvider.addressById(PartnerService.contractId);
      return partnerAddress !== ZeroAddress ? partnerAddress : undefined;
    })();
  }

  constructor(chainId: T, ctx: Context, addressProvider: AddressProvider<T>) {
    super(chainId, ctx, addressProvider);
    this.partnerId = ctx.partnerId;
  }

  isAllowed(vault: string): boolean {
    return !PartnerService.IGNORED_ADDRESSES.includes(vault);
  }

  async deposit(vault: string, amount: string, overrides: CallOverrides): Promise<unknown> {
    const contract = await this.contract;
    return contract.write.deposit(vault, this.partnerId, amount, overrides);
  }

  async populateDepositTransaction(
    vault: string,
    amount: string,
    overrides: CallOverrides
  ): Promise<PopulatedTransaction> {
    const contract = await this.contract;
    return contract.write.populateTransaction.deposit(vault, this.partnerId, amount, overrides);
  }

  async encodeDeposit(vault: string, amount: string): Promise<string> {
    const contract = await this.contract;
    return contract.write.interface.encodeFunctionData("deposit", [vault, this.partnerId, amount]);
  }
}
