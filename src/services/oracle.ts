import { BigNumber } from "@ethersproject/bignumber";

import { Address, ContractService } from "../common";
import { ChainId } from "../chain";
import { Context } from "../context";

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
    super(
      ctx.address("oracle") ?? OracleService.addressByChain(chainId),
      chainId,
      ctx
    );
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 250:
        return "0xae813841436fe29b95a14AC701AFb1502C4CB789";
    }
  }

  async getCalculations(): Promise<Address[]> {
    return await this.contract.calculations();
  }

  async getPriceUsdcRecommended(token: Address): Promise<BigNumber> {
    return await this.contract.getPriceUsdcRecommended(token);
  }

  async getUsdcAddress(): Promise<BigNumber> {
    return await this.contract.usdcAddress();
  }

  // Calculations Curve
  // function isCurveLpToken(address) public view returns (bool)
  // function getCurvePriceUsdc(address) public view returns (uint256)
  // function getBasePrice(address) public view returns (uint256)
  // function getVirtualPrice(address) public view returns (uint256)
  // function getFirstUnderlyingCoinFromPool(address) public view returns (address)
  // function curveRegistryAddress() public view returns (address)

  async isCurveLpToken(lpToken: Address): Promise<boolean> {
    return await this.contract.isCurveLpToken(lpToken);
  }

  async getCurvePriceUsdc(lpToken: Address): Promise<BigNumber> {
    return await this.contract.getCurvePriceUsdc(lpToken);
  }

  async getBasePrice(lpToken: Address): Promise<BigNumber> {
    return await this.contract.getBasePrice(lpToken);
  }

  async getVirtualPrice(lpToken: Address): Promise<BigNumber> {
    return await this.contract.getVirtualPrice(lpToken);
  }

  async getFirstUnderlyingCoinFromPool(pool: Address): Promise<Address> {
    return await this.contract.getFirstUnderlyingCoinFromPool(pool);
  }

  async getCurveRegistryAddress(): Promise<BigNumber> {
    return await this.contract.usdcAddress();
  }

  // Calculations Iron Bank
  // function isIronBankMarket(address) public view returns (bool)
  // function getIronBankMarketPriceUsdc(address) public view returns (uint256)
  // function getIronBankMarkets() public view returns (address[] memory)

  async isIronBankMarket(token: Address): Promise<boolean> {
    return await this.contract.isIronBankMarket(token);
  }

  async getIronBankMarketPriceUsdc(token: Address): Promise<BigNumber> {
    return await this.contract.getIronBankMarketPriceUsdc(token);
  }

  async getIronBankMarkets(): Promise<Address[]> {
    return await this.contract.getIronBankMarkets();
  }

  // Calculations Sushiswap
  // function isLpToken(address) public view returns (bool)
  // function getPriceFromRouter(address, address) public view returns (uint256)
  // function getPriceFromRouterUsdc(address) public view returns (uint256)
  // function getLpTokenTotalLiquidityUsdc(address) public view returns (uint256)
  // function getLpTokenPriceUsdc(address) public view returns (uint256)

  async isLpToken(token: Address): Promise<boolean> {
    return await this.contract.isLpToken(token);
  }

  async getPriceFromRouter(
    token0: Address,
    token1: Address
  ): Promise<BigNumber> {
    return await this.contract.getPriceFromRouter(token0, token1);
  }

  async getPriceFromRouterUsdc(token: Address): Promise<BigNumber> {
    return await this.contract.getPriceFromRouterUsdc(token);
  }

  async getLpTokenTotalLiquidityUsdc(token: Address): Promise<BigNumber> {
    return await this.contract.getLpTokenTotalLiquidityUsdc(token);
  }

  async getLpTokenPriceUsdc(token: Address): Promise<BigNumber> {
    return await this.contract.getLpTokenPriceUsdc(token);
  }
}
