import BigNumber from "bignumber.js";

import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { PROTOCOL_FEES } from "../services/subgraph/apollo/queries";
import { FeesResponse } from "../services/subgraph/responses";
import { Usdc } from "../types";

export class FeesInterface<C extends ChainId> extends ServiceInterface<C> {
  async protocolFees(since: Date): Promise<Usdc> {
    const response = (await this.yearn.services.subgraph.fetchQuery(PROTOCOL_FEES, {
      sinceDate: since.getTime().toString()
    })) as FeesResponse;

    const transfers = response.data.transfers;

    return transfers
      .reduce((prev, current) => {
        return prev.plus(new BigNumber(current.tokenAmountUsdc || 0));
      }, new BigNumber(0))
      .toFixed(0);
  }
}
