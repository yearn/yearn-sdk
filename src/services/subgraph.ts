import { Service } from "../common";

const subgraphUrl =
  "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet";

export class SubgraphService extends Service {
  async performQuery(query: String): Promise<any | undefined> {
    const response = await fetch(subgraphUrl, {
      method: "POST",
      body: JSON.stringify({ query })
    });

    return response.json();
  }
}
