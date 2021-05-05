import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import { Service } from "../common";

export class SubgraphService extends Service {
  client = new ApolloClient({
    link: new HttpLink({
      uri: "https://api.thegraph.com/subgraphs/name/tomprsn/yearn-vaults-v2-subgraph-mainnet"
    }),
    cache: new InMemoryCache()
  });
}
