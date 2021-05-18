import { struct, structArray } from "../../struct";
import { ContractService } from "../../common";
import { AdapterAbi } from "../../abi";
import { ChainId } from "../../chain";
import { Context } from "../../context";

import {
  Position,
  IronBankMarketStatic,
  IronBankMarketDynamic,
  IronBankPosition,
  CyTokenUserMetadata,
  Address
} from "../../types";

const CyTokenMetadataAbi = `tuple(
  uint256 totalSuppliedUsdc,
  uint256 totalBorrowedUsdc,
  uint256 lendApyBips,
  uint256 borrowApyBips,
  uint256 liquidity,
  uint256 liquidityUsdc,
  uint256 collateralFactor,
  bool isActive,
  uint256 reserveFactor,
  uint256 exchangeRate
)`;

const CyTokenUserMetadataAbi = `tuple(
  address assetAddress,
  bool enteredMarket,
  uint256 supplyBalanceUsdc,
  uint256 borrowBalanceUsdc,
  uint256 borrowLimitUsdc
)`;

const IronBankPositionAbi = `tuple(
  uint256 supplyBalanceUsdc,
  uint256 borrowBalanceUsdc,
  uint256 borrowLimitUsdc,
  uint256 utilizationRatioBips
)`;

const CustomAbi = [
  `function adapterPositionOf(address) external view returns (${IronBankPositionAbi} memory)`,
  `function assetsUserMetadata(address) public view returns (${CyTokenUserMetadataAbi}[] memory)`
];

export class IronBankAdapter<T extends ChainId> extends ContractService {
  static abi = AdapterAbi(CyTokenMetadataAbi).concat(CustomAbi);

  constructor(chainId: T, ctx: Context) {
    super(ctx.addresses.adapters.ironBank ?? IronBankAdapter.addressByChain(chainId), chainId, ctx);
  }

  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0xFF0bd2d0C7E9424ccB149ED3757155eEf41a793D";
      case 250: // FIXME: doesn't actually exist
        return "0xFF0bd2d0C7E9424ccB149ED3757155eEf41a793D";
    }
  }

  async assetsStatic(addresses?: Address[]): Promise<IronBankMarketStatic[]> {
    if (addresses) {
      return await this.contract.read["assetsStatic(address[])"](addresses).then(structArray);
    }
    return await this.contract.read["assetsStatic()"]().then(structArray);
  }

  async assetsDynamic(addresses?: Address[]): Promise<IronBankMarketDynamic[]> {
    if (addresses) {
      return await this.contract.read["assetsDynamic(address[])"](addresses).then(structArray);
    }
    return await this.contract.read["assetsDynamic()"]().then(structArray);
  }

  async positionsOf(address: Address, addresses?: Address[]): Promise<Position[]> {
    if (addresses) {
      return await this.contract.read["assetsPositionsOf(address,address[])"](address, addresses).then(structArray);
    }
    return await this.contract.read["assetsPositionsOf(address)"](address).then(structArray);
  }

  async generalPositionOf(address: Address): Promise<IronBankPosition> {
    return await this.contract.read.adapterPositionOf(address).then(struct);
  }

  async assetsUserMetadata(address: Address): Promise<CyTokenUserMetadata[]> {
    return await this.contract.read.assetsUserMetadata(address).then(structArray);
  }

  async tokens(): Promise<Address[]> {
    return await this.contract.read.assetsTokensAddresses();
  }
}
