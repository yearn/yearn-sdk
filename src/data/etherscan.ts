import fetch from "node-fetch";
import throttle from "p-throttle";

import { Context } from "./context";

const EtherscanEndpoint = "https://api.etherscan.io";

const ratelimited = throttle({
  limit: 5,
  interval: 1000
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrap<T extends (...args: any[]) => any>(fn: T): T {
  const wrapped = ratelimited(fn);
  return ((...args: Parameters<T>) => {
    return wrapped(...args);
  }) as T;
}

type AllFieldString<T> = { [TK in keyof T]: string };

export interface QueryTransactionList {
  address: string;
  startBlock?: number;
  endBlock?: number;
  page?: number;
  offset?: number;
  sort?: "asc" | "desc";
}

export interface Transaction {
  blockNumber: number;
  timeStamp: number;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
}

function transformTransactions({
  blockNumber,
  timeStamp,
  ...rest
}: AllFieldString<Transaction>): Transaction {
  return {
    ...rest,
    blockNumber: parseInt(blockNumber),
    timeStamp: parseInt(timeStamp)
  };
}

export const fetchTransactionList = wrap(
  async (query: QueryTransactionList, ctx: Context): Promise<Transaction[]> => {
    const params = new URLSearchParams();

    params.append("module", "account");
    params.append("action", "txlist");
    params.append("address", query.address);
    query.startBlock && params.append("startBlock", String(query.startBlock));
    query.endBlock && params.append("offset", String(query.endBlock));
    query.page && params.append("page", String(query.page));
    query.page && params.append("offset", String(query.offset));
    params.append("sort", query.sort ?? "asc");
    params.append("apikey", ctx.etherscan);

    const url = `${EtherscanEndpoint}/api?${params.toString()}`;
    const response = await fetch(url).then(res => res.json());
    return response.result.map(transformTransactions);
  }
);
