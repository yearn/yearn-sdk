import { ChainId } from "../chain";
import { ServiceInterface } from "../common";
import { Usdc } from "../types";
import {
  ProtocolFees as ProtocolFeesQuery,
  ProtocolFeesVariables as ProtocolFeesQueryVariables
} from "../services/subgraph/apollo/generated/ProtocolFees";
import { PROTOCOL_FEES } from "../services/subgraph/apollo/queries";
import BigNumber from "bignumber.js";

export class FeesInterface<C extends ChainId> extends ServiceInterface<C> {
  async protocolFees(since: Date): Promise<Usdc> {
    const transfers = await this.yearn.services.subgraph.client
      .query<ProtocolFeesQuery, ProtocolFeesQueryVariables>({
        query: PROTOCOL_FEES,
        variables: {
          sinceDate: since.getTime().toString()
        }
      })
      .then(response => response.data.transfers);

    return transfers
      .reduce((prev, current) => {
        return prev.plus(new BigNumber(current.tokenAmountUsdc || 0));
      }, new BigNumber(0))
      .toFixed(0);
  }
}
