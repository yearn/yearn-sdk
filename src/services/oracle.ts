import { CallOverrides } from "@ethersproject/contracts";

import { ChainId } from "../chain";
import { ContractService } from "../common";
import { Context } from "../context";
import { int, usdc } from "../helpers";
import { Address, Integer, Usdc } from "../types";

interface CoinGeckoPriceResponse {
  [key: string]: {
    usd: number;
  };
}

export const OracleAbi = [
  // Oracle general
  "function calculations() external view returns (address[] memory)",
  "function getPriceUsdcRecommended(address) public view returns (uint256)",
  "function usdcAddress() public view returns (address)",
  "function getNormalizedValueUsdc(address,uint256) view returns (uint256)",
  // Calculations Curve
  "function isCurveLpToken(address) public view returns (bool)",
  "function getCurvePriceUsdc(address) public view returns (uint256)",
  "function getBasePrice(address) public view returns (uint256)",
  "function getVirtualPrice(address) public view returns (uint256)",
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

const ftmTokenOverrides: { address: Address; id: string }[] = [
  {
    address: "0x44B26E839eB3572c5E959F994804A5De66600349",
    id: "hegic"
  },
  {
    address: "0x29b0Da86e484E1C0029B56e817912d778aC0EC69",
    id: "yearn-finance"
  }
];

let ftmTokenOverridePriceCache: { response: CoinGeckoPriceResponse; expiry: Date };

/**
 * [[OracleService]] is the main pricing engine, used by all price calculations.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */
export class OracleService<T extends ChainId> extends ContractService<T> {
  static abi = OracleAbi;

  constructor(chainId: T, ctx: Context) {
    super(ctx.addresses.oracle ?? OracleService.addressByChain(chainId), chainId, ctx);
  }

  /**
   * Get most up-to-date address of the Oracle contract for a particular chain
   * id.
   * @param chainId
   * @returns address
   */
  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0x83d95e0D5f402511dB06817Aff3f9eA88224B030";
      case 250:
        return "0x57AA88A0810dfe3f9b71a9b179Dd8bF5F956C46A";
    }
  }

  /**
   * Fetch all the active Oracle calculations.
   * @param overrides
   * @returns list of calculations contract addresses
   */
  async getCalculations(overrides: CallOverrides = {}): Promise<Address[]> {
    return await this.contract.read.calculations(overrides);
  }

  /**
   * Get the suggested Usdc exchange rate for an token.
   * @param token
   * @param overrides
   * @returns Usdc exchange rate (6 decimals)
   */
  async getPriceUsdc(token: Address, overrides: CallOverrides = {}): Promise<Usdc> {
    if (this.chainId === 250) {
      const override = await this.ftmOverridePrice(token);
      if (override) {
        return override;
      }
    }
    return await this.contract.read.getPriceUsdcRecommended(token, overrides).then(int);
  }

  /**
   * Get the normalized Usdc value for the token and corresponding quantity.
   * @param token
   * @param amount
   * @param overrides
   * @returns Usdc exchange rate (6 decimals)
   */
  async getNormalizedValueUsdc(token: Address, amount: Integer, overrides: CallOverrides = {}): Promise<Usdc> {
    return await this.contract.read.getNormalizedValueUsdc(token, amount, overrides).then(int);
  }

  /**
   * Get the token address that lens considers Usdc.
   * @param overrides
   * @returns address
   */
  async getUsdcAddress(overrides: CallOverrides = {}): Promise<Address> {
    return await this.contract.read.usdcAddress(overrides);
  }

  // Calculations Curve

  /**
   * Test if a token address is a curve liquidity provider token.
   * @param lpToken
   * @param overrides
   * @returns test result
   */
  async isCurveLpToken(lpToken: Address, overrides: CallOverrides = {}): Promise<boolean> {
    return await this.contract.read.isCurveLpToken(lpToken, overrides);
  }

  /**
   * Get Usdc exchange rate for a curve liquidity provider token.
   * @param lpToken
   * @param overrides
   * @returns Usdc exchange rate (6 decimals)
   */
  async getCurvePriceUsdc(lpToken: Address, overrides: CallOverrides = {}): Promise<Usdc> {
    return await this.contract.read.getCurvePriceUsdc(lpToken, overrides).then(int);
  }

  /**
   * Get Usdc exchange rate of underlying token of the curve liquidity provider
   * token's pool.
   * @param lpToken
   * @param overrides
   * @returns Usdc exchange rate (6 decimals)
   */
  async getBasePrice(lpToken: Address, overrides: CallOverrides = {}): Promise<Usdc> {
    return await this.contract.read.getBasePrice(lpToken, overrides).then(int);
  }

  /**
   * Get virtual price for a curve liquidity provider token.
   * @param lpToken
   * @param overrides
   * @returns virtual price
   */
  async getVirtualPrice(lpToken: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getVirtualPrice(lpToken, overrides).then(int);
  }

  /**
   * Get the contract address that lens considers as Curve Registry.
   * @param overrides
   * @returns
   */
  async getCurveRegistryAddress(overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.usdcAddress(overrides).then(int);
  }

  // Calculations: Iron Bank

  /**
   * Test if a token address is an iron bank market.
   * @param token
   * @param overrides
   * @returns test result
   */
  async isIronBankMarket(token: Address, overrides: CallOverrides = {}): Promise<boolean> {
    return await this.contract.read.isIronBankMarket(token, overrides);
  }

  /**
   * Get Usdc exchange rate for an iron bank market token.
   * @param token
   * @param overrides
   * @returns Usdc exchange rate (6 decimals)
   */
  async getIronBankMarketPriceUsdc(token: Address, overrides: CallOverrides = {}): Promise<Usdc> {
    return await this.contract.read.getIronBankMarketPriceUsdc(token, overrides).then(int);
  }

  /**
   * Get all the iron bank market addresses.
   * @param overrides
   * @returns list of iron bank market addresses
   */
  async getIronBankMarkets(overrides: CallOverrides = {}): Promise<Address[]> {
    return await this.contract.read.getIronBankMarkets(overrides);
  }

  // Calculations: Sushiswap

  /**
   * Test if a token address is a sushiswap liquidity provider token.
   * @param token
   * @param overrides
   * @returns test result
   */
  async isLpToken(token: Address, overrides: CallOverrides = {}): Promise<boolean> {
    return await this.contract.read.isLpToken(token, overrides);
  }

  /**
   * Get exchange rate between two tokens from the sushiswap router.
   * @param token0
   * @param token1
   * @param overrides
   * @returns exchange rate
   */
  async getPriceFromRouter(token0: Address, token1: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getPriceFromRouter(token0, token1, overrides).then(int);
  }

  /**
   * Get Usdc exchange rate for a token.
   * @param token
   * @param overrides
   * @returns Usdc exchange rate (6 decimals)
   */
  async getPriceFromRouterUsdc(token: Address, overrides: CallOverrides = {}): Promise<Usdc> {
    return await this.contract.read.getPriceFromRouterUsdc(token, overrides).then(int);
  }

  /**
   * Get total liquidity for a liquidity provider token in Usdc
   * @param token
   * @param overrides
   * @returns Usdc liquidity (6 decimals)
   */
  async getLpTokenTotalLiquidityUsdc(token: Address, overrides: CallOverrides = {}): Promise<Usdc> {
    return await this.contract.read.getLpTokenTotalLiquidityUsdc(token, overrides).then(int);
  }

  /**
   * Get Usdc exchange rate for a sushiswap liquidity provider token.
   * @param token
   * @param overrides
   * @returns Usdc exchange rate (6 decimals)
   */
  async getLpTokenPriceUsdc(token: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getLpTokenPriceUsdc(token, overrides).then(int);
  }

  /**
   *
   * @param token a token from the override list that's price will be fetched from CoinGecko
   * @returns price in usdc from CoinGecko
   */
  private async ftmOverridePrice(token: Address): Promise<Usdc | undefined> {
    const override = ftmTokenOverrides.find(override => override.address === token);
    if (!override) {
      return undefined;
    }
    let response: CoinGeckoPriceResponse;
    if (ftmTokenOverridePriceCache && ftmTokenOverridePriceCache.expiry < new Date()) {
      response = ftmTokenOverridePriceCache.response;
    } else {
      const ids = ftmTokenOverrides.map(override => override.id).join();
      const coingeckoResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      ).then(res => res.json());
      const expiry = new Date();
      expiry.setSeconds(new Date().getSeconds() + 30);
      ftmTokenOverridePriceCache = { response: coingeckoResponse, expiry: expiry };
      response = coingeckoResponse;
    }
    return usdc(response[override.id].usd);
  }
}
