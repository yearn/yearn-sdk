import { Service } from "../../common";

const YearnSubgraphEndpoint = "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet";

export class SubgraphService extends Service {
  async fetchQuery(query: string, variables: { [key: string]: any } = {}): Promise<unknown> {
    Object.keys(variables).forEach(key => {
      const variable = variables[key];
      if (typeof variable === "string") {
        // the subgraph only works with lowercased addresses
        variables[key] = variable.toLowerCase();
      }
    });

    const body = {
      query: query,
      variables: variables
    };

    return await fetch(YearnSubgraphEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(res => res.json());
  }
}
