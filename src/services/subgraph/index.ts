import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { HttpLink } from "apollo-link-http";

import { Service } from "../../common";

const YearnSubgraphEndpoint = "https://api.thegraph.com/subgraphs/name/jstashh/yearn-subgraph-three";

export class SubgraphService extends Service {
  client = new ApolloClient({
    link: new HttpLink({
      uri: YearnSubgraphEndpoint
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "no-cache",
        errorPolicy: "ignore"
      },
      query: {
        fetchPolicy: "no-cache",
        errorPolicy: "all"
      }
    }
  });
}
