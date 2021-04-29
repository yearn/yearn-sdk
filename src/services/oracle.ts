import { Address, Integer, ContractService } from "../common";
import { ChainId } from "../chain";
import { Context } from "../context";
import { int } from "../helpers";

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
        return "0xd3ca98D986Be88b72Ff95fc2eC976a5E6339150d";
      case 250:
        return "0xae813841436fe29b95a14AC701AFb1502C4CB789";
    }
    throw new TypeError(
      `Oracle does not have an address for chainId ${chainId}`
    );
  }

  async getCalculations(): Promise<Address[]> {
    return await this.contract.calculations();
  }

  async getPriceUsdc(token: Address): Promise<Integer> {
    return await this.contract.getPriceUsdcRecommended(token).then(int);
  }

  async getUsdcAddress(): Promise<Integer> {
    return await this.contract.usdcAddress().then(int);
  }

  // Calculations Curve

  async isCurveLpToken(lpToken: Address): Promise<boolean> {
    return await this.contract.isCurveLpToken(lpToken);
  }

  async getCurvePriceUsdc(lpToken: Address): Promise<Integer> {
    return await this.contract.getCurvePriceUsdc(lpToken).then(int);
  }

  async getBasePrice(lpToken: Address): Promise<Integer> {
    return await this.contract.getBasePrice(lpToken).then(int);
  }

  async getVirtualPrice(lpToken: Address): Promise<Integer> {
    return await this.contract.getVirtualPrice(lpToken).then(int);
  }

  async getFirstUnderlyingCoinFromPool(pool: Address): Promise<Address> {
    return await this.contract.getFirstUnderlyingCoinFromPool(pool);
  }

  async getCurveRegistryAddress(): Promise<Integer> {
    return await this.contract.usdcAddress().then(int);
  }

  // Calculations: Iron Bank

  async isIronBankMarket(token: Address): Promise<boolean> {
    return await this.contract.isIronBankMarket(token);
  }

  async getIronBankMarketPriceUsdc(token: Address): Promise<Integer> {
    return await this.contract.getIronBankMarketPriceUsdc(token).then(int);
  }

  async getIronBankMarkets(): Promise<Address[]> {
    return await this.contract.getIronBankMarkets();
  }

  // Calculations: Sushiswap

  async isLpToken(token: Address): Promise<boolean> {
    return await this.contract.isLpToken(token);
  }

  async getPriceFromRouter(token0: Address, token1: Address): Promise<Integer> {
    return await this.contract.getPriceFromRouter(token0, token1).then(int);
  }

  async getPriceFromRouterUsdc(token: Address): Promise<Integer> {
    return await this.contract.getPriceFromRouterUsdc(token).then(int);
  }

  async getLpTokenTotalLiquidityUsdc(token: Address): Promise<Integer> {
    return await this.contract.getLpTokenTotalLiquidityUsdc(token).then(int);
  }

  async getLpTokenPriceUsdc(token: Address): Promise<Integer> {
    return await this.contract.getLpTokenPriceUsdc(token).then(int);
  }
}
