import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner } from "@ethersproject/providers";

import { Service } from "../common";
import { handleHttpError } from "../helpers";
import { Address, Integer } from "../types";
import RouterAbi from "./widoRouter.json";

export class WidoService extends Service {
  async populateOrder(account: Address, toToken: Address, amount: Integer, fromToken: Address, signer: JsonRpcSigner) {
    const url = `https://api.joinwido.com/swaproute`;
    const params = new URLSearchParams({
      chain_id: "250",
      from_address: fromToken,
      to_address: toToken,
      amount: amount,
    });

    const swapRouteResponse = await fetch(`${url}?${params}`)
      .then(handleHttpError)
      .then((res) => res.json());

    const { swapRoute, minToTokenAmount } = swapRouteResponse;
    const widoContractAddress = "0x7Bbd6348db83C2fb3633Eebb70367E1AEc258764";

    const order = {
      user: account,
      fromToken,
      toToken,
      fromTokenAmount: amount,
      minToTokenAmount: minToTokenAmount,
      nonce: 0,
      expiration: 0,
    };

    const routerContract = new Contract(widoContractAddress, RouterAbi, signer);
    return routerContract.populateTransaction.executeOrder(order, swapRoute);
  }

  async withdraw(account: Address, token: Address, amount: Integer, vault: Address, signer: JsonRpcSigner) {
    return this.populateOrder(account, token, amount, vault, signer);
  }

  async deposit(account: Address, token: Address, amount: Integer, vault: Address, signer: JsonRpcSigner) {
    return this.populateOrder(account, vault, amount, token, signer);
  }
}
