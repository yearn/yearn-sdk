import fromEntries from "fromentries";
import fetch from "node-fetch";

const GhRawURL = "https://rawcdn.githack.com";
const GhApiURL = "https://api.github.com/repos";

const YearnAliasesURL = `${GhRawURL}/iearn-finance/yearn-assets/master/icons/aliases.json`;

const YearnAssetsDirURL = `${GhApiURL}/iearn-finance/yearn-assets/contents/icons/tokens`;
const YearnAssetsURL = `${GhRawURL}/iearn-finance/yearn-assets/master/icons/tokens/`;
const YearnAssetImageSuffix = "/logo-128.png";

const TrustAssetsURL = `${GhRawURL}/trustwallet/assets/master/blockchains/ethereum/tokenlist.json`;

function yearnAssetUrl(address: string): string {
  return `${YearnAssetsURL}${address}${YearnAssetImageSuffix}`;
}

export interface Alias {
  name: string;
  symbol: string;
  address: string;
}

export async function fetchAliases(): Promise<Record<string, Alias>> {
  const aliases = await fetch(YearnAliasesURL).then(res => res.json());
  return fromEntries(aliases.map((alias: Alias) => [alias.address, alias]));
}

interface YearnAssets {
  name: string;
}

export async function fetchYearnAssets(): Promise<Record<string, string>> {
  const res = await fetch(YearnAssetsDirURL).then(res => res.json());
  const assets = Array.isArray(res) ? res : [];
  return fromEntries(
    assets.map(({ name: address }: YearnAssets) => [address, yearnAssetUrl(address)])
  );
}

interface TrustAssets {
  address: string;
  logoURI: string;
}

export async function fetchTrustAssets(): Promise<Record<string, string>> {
  const { tokens } = await fetch(TrustAssetsURL).then(res => res.json());
  return fromEntries(
    tokens.map(({ address, logoURI }: TrustAssets) => [address, logoURI])
  );
}

export async function fetchAssets(): Promise<Record<string, string>> {
  const yearnAssets = await fetchYearnAssets();
  const trustAssets = await fetchTrustAssets();
  return { ...trustAssets, ...yearnAssets };
}
