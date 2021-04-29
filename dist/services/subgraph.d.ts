import { Service } from "../common";
export declare class SubgraphService extends Service {
    performQuery(query: String): Promise<any | undefined>;
}
