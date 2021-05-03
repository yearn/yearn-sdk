import { Service } from "../common";

interface DataContainer {
  data: any
}

// TODO - revert to salazarguille/yearn-vaults-v2-subgraph-mainnet once https://github.com/yearn/yearn-vaults-v2-subgraph/pull/61 has been merged
const subgraphUrl =
  "https://api.thegraph.com/subgraphs/name/tomprsn/yearn-vaults-v2-subgraph-mainnet";

export class SubgraphService extends Service {
  async performQuery(query: String): Promise<any | undefined> {
    const response = await fetch(subgraphUrl, {
      method: "POST",
      body: JSON.stringify({ query })
    });

    const result: DataContainer = await response.json()
    return result.data
  }
}
