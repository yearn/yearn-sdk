import fetch from "node-fetch";

export async function getPrices(
  tokenAddresses: string[]
): Promise<Record<string, Record<string, string>>> {
  const tokenAddressesCombined = tokenAddresses.join(",");
  // TODO: JSX not working here
  const url =
    "https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=" +
    tokenAddressesCombined +
    "&vs_currencies=usd";
  const prices = await fetch(url).then(res => res.json());
  return prices;
}

export async function getPrice(tokenAddress: string): Promise<number> {
  // TODO: JSX not working here
  const url =
    "https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=" +
    tokenAddress +
    "&vs_currencies=usd";
  const prices = await fetch(url).then(res => res.json());
  const tokenPrice = prices[tokenAddress.toLowerCase()];
  const price = parseFloat(tokenPrice && tokenPrice.usd);
  return price;
}
