import { ChainId } from "../../chain";
import { Service } from "../../common";
import { Context } from "../../context";
import { SdkError } from "../../types";

export class SubgraphService extends Service {
  yearnSubgraphEndpoint?: string;

  constructor(chainId: ChainId, ctx: Context) {
    super(chainId, ctx);

    switch (chainId) {
      case 1:
      case 1337:
        // no fallback for mainnet as the hosted version has been deprecated.
        this.yearnSubgraphEndpoint = ctx.subgraph?.mainnetSubgraphEndpoint;
        break;
      case 250:
        this.yearnSubgraphEndpoint =
          ctx.subgraph?.fantomSubgraphEndpoint ||
          "https://api.thegraph.com/subgraphs/name/yearn/yearn-vaults-v2-fantom";
        break;
      case 42161:
        this.yearnSubgraphEndpoint =
          ctx.subgraph?.arbitrumSubgraphEndpoint ||
          "https://api.thegraph.com/subgraphs/name/yearn/yearn-vaults-v2-arbitrum";
        break;
      default:
        throw new SdkError(`No subgraph name for chain ${chainId}`);
    }
  }

  async fetchQuery<T>(query: string, variables: { [key: string]: unknown } = {}): Promise<T> {
    if (!this.yearnSubgraphEndpoint) {
      throw new SdkError(
        "the subgraph service has not been configured to be able to make queries, configure it in the `Context` object"
      );
    }

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

    return await fetch(this.yearnSubgraphEndpoint, {
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
