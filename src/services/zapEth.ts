// Custom service to zap in ETH to yvWETH vault and zap out from yvWETH vault to ETH without zap fees on eth mainnet
// https://github.com/yearn/zaps/blob/master/contracts/ZapEth.vy

import { Contract } from "@ethersproject/contracts";
import { TransactionRequest } from "@ethersproject/providers";

import { ChainId } from "../chain";
import { ContractAddressId, ContractService } from "../common";
import { isNativeToken, isWethVault } from "../helpers";
import { Address, Integer, SdkError } from "../types";

const zapEthAbi = ["function deposit() payable", "function withdraw(uint256 amount) public"];

export class ZapEthService<T extends ChainId> extends ContractService<T> {
  async zapIn(vault: Address, token: Address, amount: Integer, account: Address): Promise<TransactionRequest> {
    if (!isNativeToken(token)) throw new SdkError(`Only "ETH" token address is supported by zapEth contract`);
    if (!isWethVault(vault)) throw new SdkError(`Only "yvWETH" vault address is supported by zapEth contract`);

    const zapEthContract = await this.getContract(account);
    const tx = await zapEthContract.populateTransaction.deposit({ value: amount });

    return tx;
  }

  async zapOut(vault: Address, token: Address, amount: Integer, account: Address): Promise<TransactionRequest> {
    if (!isNativeToken(token)) throw new SdkError(`Only "ETH" token address is supported by zapEth contract`);
    if (!isWethVault(vault)) throw new SdkError(`Only "yvWETH" vault address is supported by zapEth contract`);

    const zapEthContract = await this.getContract(account);
    const tx = await zapEthContract.populateTransaction.withdraw(amount);

    return tx;
  }

  private async getAddress(): Promise<Address> {
    return await this.addressProvider.addressById(ContractAddressId.yearnZapEth);
  }

  private async getContract(account: Address): Promise<Contract> {
    const zapEthAddress = await this.getAddress();
    const signer = this.ctx.provider.write.getSigner(account);
    return new Contract(zapEthAddress, zapEthAbi, signer);
  }
}
