import { ContractService } from "../common";
import { ChainId } from "../chain";
import { Context } from "../context";
import { int } from "../helpers";
import { Address, Integer } from "../types";
import { CallOverrides } from "@ethersproject/contracts";

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

/**
 * [[OracleService]] is the main pricing engine, used by all price calculations.
 * It's implemented in the form of a contract that lives on all networks
 * supported by yearn.
 */
export class OracleService<T extends ChainId> extends ContractService {
  static abi = OracleAbi;

  constructor(chainId: T, ctx: Context) {
    super(ctx.addresses.oracle ?? OracleService.addressByChain(chainId), chainId, ctx);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0xd3ca98D986Be88b72Ff95fc2eC976a5E6339150d";
      case 250:
        return "0xae813841436fe29b95a14AC701AFb1502C4CB789";
    }
  }

  async getCalculations(overrides: CallOverrides = {}): Promise<Address[]> {
    return await this.contract.read.calculations(overrides);
  }

  async getPriceUsdc(token: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getPriceUsdcRecommended(token, overrides).then(int);
  }

  async getUsdcAddress(overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.usdcAddress(overrides).then(int);
  }

  // Calculations Curve

  async isCurveLpToken(lpToken: Address, overrides: CallOverrides = {}): Promise<boolean> {
    return await this.contract.read.isCurveLpToken(lpToken, overrides);
  }

  async getCurvePriceUsdc(lpToken: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getCurvePriceUsdc(lpToken, overrides).then(int);
  }

  async getBasePrice(lpToken: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getBasePrice(lpToken, overrides).then(int);
  }

  async getVirtualPrice(lpToken: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getVirtualPrice(lpToken, overrides).then(int);
  }

  async getFirstUnderlyingCoinFromPool(pool: Address, overrides: CallOverrides = {}): Promise<Address> {
    return await this.contract.read.getFirstUnderlyingCoinFromPool(pool, overrides);
  }

  async getCurveRegistryAddress(overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.usdcAddress(overrides).then(int);
  }

  // Calculations: Iron Bank

  async isIronBankMarket(token: Address, overrides: CallOverrides = {}): Promise<boolean> {
    return await this.contract.read.isIronBankMarket(token, overrides);
  }

  async getIronBankMarketPriceUsdc(token: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getIronBankMarketPriceUsdc(token, overrides).then(int);
  }

  async getIronBankMarkets(overrides: CallOverrides = {}): Promise<Address[]> {
    return await this.contract.read.getIronBankMarkets(overrides);
  }

  // Calculations: Sushiswap

  async isLpToken(token: Address, overrides: CallOverrides = {}): Promise<boolean> {
    return await this.contract.read.isLpToken(token, overrides);
  }

  async getPriceFromRouter(token0: Address, token1: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getPriceFromRouter(token0, token1, overrides).then(int);
  }

  async getPriceFromRouterUsdc(token: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getPriceFromRouterUsdc(token, overrides).then(int);
  }

  async getLpTokenTotalLiquidityUsdc(token: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getLpTokenTotalLiquidityUsdc(token, overrides).then(int);
  }

  async getLpTokenPriceUsdc(token: Address, overrides: CallOverrides = {}): Promise<Integer> {
    return await this.contract.read.getLpTokenPriceUsdc(token, overrides).then(int);
  }
}
