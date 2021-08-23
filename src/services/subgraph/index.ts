import { Service } from "../../common";
import { SdkError } from "../../types";

const YearnSubgraphEndpoint = "https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-mainnet";

export class SubgraphService extends Service {
  async fetchQuery(query: string, variables: { [key: string]: any } = {}): Promise<unknown> {
    // the subgraph only works with lowercased addresses
    Object.keys(variables).forEach(key => {
      const variable = variables[key];
      if (typeof variable === "string") {
        variables[key] = variable.toLowerCase();
      } else if (Array.isArray(variable)) {
        for (const [index, value] of variable.entries()) {
          if (typeof value === "string") {
            variable[index] = value.toLowerCase();
          }
        }
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
    })
      .then(res => res.json())
      .then(json => {
        if (json.errors) {
          throw new SdkError(`Subgraph Error - ${JSON.stringify(json.errors)}`);
        }
        return json;
      });
  }
}
