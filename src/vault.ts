import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber } from "bignumber.js";

import { Address } from "./types";

export abstract class VaultContract {
  protected static get abi(): string[] {
    return [
      "function token() view returns (address)",
      "function decimals() view returns (uint256)",
      "function deposit(uint256 amount) public",
      "function withdraw(uint256 amount) public",
    ];
  }

  constructor(protected contract: Contract) {}

  abstract pricePerShare(): Promise<BigNumber>;

  async decimals(): Promise<BigNumber> {
    const decimals = await this.contract.decimals();
    return new BigNumber(decimals.toString());
  }

  async token(): Promise<Address> {
    return await this.contract.token();
  }

  encodeDeposit = (amount: string): string => {
    return this.contract.interface.encodeFunctionData("deposit", [amount]);
  };

  encodeWithdraw = (amount: string): string => {
    return this.contract.interface.encodeFunctionData("withdraw", [amount]);
  };
}

export class PickleJarContract extends VaultContract {
  private static get pickleJarAbi(): string[] {
    return ["function getRatio() public view returns (uint256)"];
  }

  constructor(jarAddress: Address, signer: JsonRpcSigner) {
    super(new Contract(jarAddress, [...VaultContract.abi, ...PickleJarContract.pickleJarAbi], signer));
  }

  async pricePerShare(): Promise<BigNumber> {
    const ratio = await this.contract.getRatio();
    return new BigNumber(ratio.toString());
  }
}

export class YearnVaultContract extends VaultContract {
  private static get yearnVaultAbi(): string[] {
    return ["function pricePerShare() view returns (uint256)"];
  }

  constructor(jarAddress: Address, signer: JsonRpcSigner) {
    super(new Contract(jarAddress, [...VaultContract.abi, ...YearnVaultContract.yearnVaultAbi], signer));
  }

  async pricePerShare(): Promise<BigNumber> {
    const pricePerShare = await this.contract.pricePerShare();
    return new BigNumber(pricePerShare.toString());
  }
}
