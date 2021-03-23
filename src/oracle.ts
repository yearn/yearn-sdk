import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";

import { Address } from "./common";

export const OracleAddress = "0x9b8b9F6146B29CC32208f42b995E70F0Eb2807F3";
export const OracleAbi = [
  // Oracle general
  "function calculations() external view returns (address[] memory)",
  "function getPriceUsdcRecommended(address) public view returns (uint256)",
  "function usdcAddress() public view returns (address)",
  // Calculations Curve
  "function isCurveLpToken(address) public view returns (bool)",
  "function getCurvePriceUsdc(address) public view returns (uint256)",
  "function getBasePrice(address) public view returns (uint256)",
  "function getVirtualPrice(address) public view returns (uint256)",
  "function getFirstUnderlyingCoinFromPool(address) public view returns (address)",
  "function curveRegistryAddress() public view returns (address)",
  // Calculations Iron Bank
  "function isIronBankMarket(address) public view returns (bool)",
  "function getIronBankMarketPriceUsdc(address) public view returns (uint256)",
  "function getIronBankMarkets() public view returns (address[] memory)",
  // Calculations Sushiswap
  "function isLpToken(address) public view returns (bool)",
  "function getPriceFromRouter(address, address) public view returns (uint256)",
  "function getPriceFromRouterUsdc(address) public view returns (uint256)",
  "function getLpTokenTotalLiquidityUsdc(address) public view returns (uint256)",
  "function getLpTokenPriceUsdc(address) public view returns (uint256)"
];

export async function getCalculations(provider: Provider): Promise<Address[]> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.calculations();
}

export async function getPriceUsdcRecommended(
  token: Address,
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getPriceUsdcRecommended(token);
}

export async function getUsdcAddress(provider: Provider): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.usdcAddress();
}

// Calculations Curve
// function isCurveLpToken(address) public view returns (bool)
// function getCurvePriceUsdc(address) public view returns (uint256)
// function getBasePrice(address) public view returns (uint256)
// function getVirtualPrice(address) public view returns (uint256)
// function getFirstUnderlyingCoinFromPool(address) public view returns (address)
// function curveRegistryAddress() public view returns (address)

export async function isCurveLpToken(
  lpToken: Address,
  provider: Provider
): Promise<boolean> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.isCurveLpToken(lpToken);
}

export async function getCurvePriceUsdc(
  lpToken: Address,
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getCurvePriceUsdc(lpToken);
}

export async function getBasePrice(
  lpToken: Address,
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getBasePrice(lpToken);
}

export async function getVirtualPrice(
  lpToken: Address,
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getVirtualPrice(lpToken);
}

export async function getFirstUnderlyingCoinFromPool(
  pool: Address,
  provider: Provider
): Promise<Address> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getFirstUnderlyingCoinFromPool(pool);
}

export async function getCurveRegistryAddress(
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.usdcAddress();
}

// Calculations Iron Bank
// function isIronBankMarket(address) public view returns (bool)
// function getIronBankMarketPriceUsdc(address) public view returns (uint256)
// function getIronBankMarkets() public view returns (address[] memory)

export async function isIronBankMarket(
  token: Address,
  provider: Provider
): Promise<boolean> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.isIronBankMarket(token);
}

export async function getIronBankMarketPriceUsdc(
  token: Address,
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getIronBankMarketPriceUsdc(token);
}

export async function getIronBankMarkets(
  provider: Provider
): Promise<Address[]> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getIronBankMarkets();
}

// Calculations Sushiswap
// function isLpToken(address) public view returns (bool)
// function getPriceFromRouter(address, address) public view returns (uint256)
// function getPriceFromRouterUsdc(address) public view returns (uint256)
// function getLpTokenTotalLiquidityUsdc(address) public view returns (uint256)
// function getLpTokenPriceUsdc(address) public view returns (uint256)

export async function isLpToken(
  token: Address,
  provider: Provider
): Promise<boolean> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.isLpToken(token);
}

export async function getPriceFromRouter(
  token0: Address,
  token1: Address,
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getPriceFromRouter(token0, token1);
}

export async function getPriceFromRouterUsdc(
  token0: Address,
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getPriceFromRouterUsdc(token0);
}

export async function getLpTokenTotalLiquidityUsdc(
  token: Address,
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getLpTokenTotalLiquidityUsdc(token);
}

export async function getLpTokenPriceUsdc(
  token: Address,
  provider: Provider
): Promise<BigNumber> {
  const oracle = new Contract(OracleAddress, OracleAbi, provider);
  return await oracle.getLpTokenPriceUsdc(token);
}
