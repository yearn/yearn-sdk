import { Assets } from "../interfaces";

export function sumTvl(assetList: Assets): number {
  const tvl = assetList.reduce((acc, asset) => {
    acc += asset.tvl || 0;
    return acc;
  }, 0);
  return tvl;
}
