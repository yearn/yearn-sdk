import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { PROTOCOL_FEES } from "../services/subgraph/queries";
import { FeesResponse } from "../services/subgraph/responses";
import { Usdc } from "../types";
import { toBN } from "../utils";

export class FeesInterface<C extends ChainId> extends ServiceInterface<C> {
  async protocolFees(since: Date): Promise<Usdc> {
    const response = await this.yearn.services.subgraph.fetchQuery<FeesResponse>(PROTOCOL_FEES, {
      sinceDate: since.getTime().toString(),
    });

    if (!response?.data || !response.data?.transfers) {
      return toBN(0).toFixed(0);
    }

    const transfers = response.data.transfers;

    return transfers.reduce((prev, { tokenAmountUsdc }) => prev.plus(toBN(tokenAmountUsdc || 0)), toBN(0)).toFixed(0);
  }
}
