import { CallOverrides } from "@ethersproject/contracts";

import { ChainId } from "../chain";
import { ContractService } from "../common";
import { Context } from "../context";

const YVECRV = '0xc5bDdf9843308380375a611c18B50Fb9341f502A';
const PICKLE = '0xCeD67a187b923F0E5ebcc77C7f2F7da20099e378';
/**
 * [[PartnerService]] provides access to yearns partner contract.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */
export class PartnerService<T extends ChainId> extends ContractService<T> {
  static abi = ["function deposit(address vault, address partnerId, uint256 amount) external returns (uint256)"];
  static IGNORED_ADDRESSES = [YVECRV, PICKLE];
  partnerId: string;

  constructor(chainId: T, ctx: Context, address: string) {
    super(address, chainId, ctx);
    this.partnerId = ctx.partnerId;
  }

  /**
   * Get most up-to-date address of the Lens contract for a particular chain id.
   * @param chainId
   * @returns address
   */
  static addressByChain(chainId: ChainId): string | null {
    switch (chainId) {
      case 1:
        return "0x8ee392a4787397126c163cb9844d7c447da419d8";
      case 250:
      case 1337:
      case 42161:
      default:
        return null;
    }
  }

  isAllowed(vault: string) {
    return !PartnerService.IGNORED_ADDRESSES.includes(vault);
  }

  deposit(vault: string, amount: string, overrides: CallOverrides) {
    return this.contract.write.deposit(vault, this.partnerId, amount, overrides);
  }

  encodeDeposit = (vault: string, amount: string): string => {
    return this.contract.write.interface.encodeFunctionData("deposit", [vault, this.partnerId, amount]);
  };
}
