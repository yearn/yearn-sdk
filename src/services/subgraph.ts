import { Service } from "../common";

interface DataContainer {
  data: any
}

const subgraphUrl =
  "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet";

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
