import { handleHTTPError } from "@utils/fetch";
import fromEntries from "fromentries";
import fetch from "node-fetch";

export type Price<T extends string> = { [K in T]: number };
export type PriceMap<A extends string, T extends string> = { [K in A]: Price<T> };

const TokenPriceUrl = "https://api.coingecko.com/api/v3/simple/token_price/ethereum";

export async function getPrice<A extends string, T extends string>(
  tokenAddresses: A[],
  vsCurrencies: T[]
): Promise<PriceMap<A, T>>;

export async function getPrice<A extends string, T extends string>(
  tokenAddresses: A,
  vsCurrencies: T[]
): Promise<Price<T>>;

export async function getPrice<A extends string, T extends string>(
  query: A[] | A,
  vsCurrencies: T[]
): Promise<Price<T> | PriceMap<A, T>> {
  const params = new URLSearchParams();
  const addresses = Array.isArray(query) ? query.join(",") : query;
  params.append("contract_addresses", addresses);
  params.append("vs_currencies", vsCurrencies.join(","));
  const url = `${TokenPriceUrl}?${params.toString()}`;
  const prices = await fetch(url)
    .then(handleHTTPError)
    .then(res => res.json());
  if (!Array.isArray(query)) {
    return prices[query.toLowerCase()];
  }
  return fromEntries(
    Object.entries(prices).map(([address, price]) => [
      query.find(addr => addr.toLowerCase() === address) ?? address,
      price
    ])
  ) as PriceMap<A, T>;
}
