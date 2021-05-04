import { AdapterAbi } from "../../abi";
import { ChainId } from "../../chain";
import { Address, ContractService } from "../../common";
import { Context } from "../../context";
import { structArray } from "../../struct";

import { Position, IronBankMarketStatic, IronBankMarketDynamic, ERC20 } from "../../types";

export const IronBankMarketMetadata = `tuple(
  uint256 totalSuppliedUsdc,
  uint256 totalBorrowedUsdc,
  uint256 lendApyBips,
  uint256 borrowApyBips,
  uint256 liquidity,
  uint256 liquidityUsdc,
  uint256 collateralFactor,
  bool isActive,
  uint256 reserveFactor,
  uint256 collateralFactor
)`;

export class IronBankAdapter<T extends ChainId> extends ContractService {
  static abi = AdapterAbi(IronBankMarketMetadata);

  constructor(chainId: T, ctx: Context) {
    super(ctx.address("ironBankAdapter") ?? IronBankAdapter.addressByChain(chainId), chainId, ctx);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0x21670dDB429B6D80B5bE4e65532576bB14b7cC62";
      case 250: // FIXME: doesn't actually exist
        return "0x21670dDB429B6D80B5bE4e65532576bB14b7cC62";
    }
  }

  async assetsStatic(addresses?: Address[]): Promise<IronBankMarketStatic[]> {
    if (addresses) {
      return await this.contract["assetsStatic(address[])"](addresses).then(structArray);
    }
    return await this.contract["assetsStatic()"]().then(structArray);
  }

  async assetsDynamic(addresses?: Address[]): Promise<IronBankMarketDynamic[]> {
    if (addresses) {
      return await this.contract["assetsDynamic(address[])"](addresses).then(structArray);
    }
    return await this.contract["assetsDynamic()"]().then(structArray);
  }

  async positionsOf(address: Address, addresses?: Address[]): Promise<Position[]> {
    if (addresses) {
      return await this.contract["assetsPositionsOf(address,address[])"](address, addresses).then(structArray);
    }
    return await this.contract["assetsPositionsOf(address)"](address).then(structArray);
  }

  async tokens(): Promise<ERC20[]> {
    return await this.contract.tokens().then(structArray);
  }
}
