import { CallOverrides } from "@ethersproject/contracts";
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

  /**
   * Get most up-to-date address of the IronBank adapter contract for a
   * particular chain id.
   * @param chainId
   * @returns address
   */
  static addressByChain(chainId: ChainId): string {
    switch (chainId) {
      case 1:
      case 1337:
        return "0xFF0bd2d0C7E9424ccB149ED3757155eEf41a793D";
      case 250: // FIXME: doesn't actually exist
        return "0xFF0bd2d0C7E9424ccB149ED3757155eEf41a793D";
    }
  }

  /**
   * Get the static part of IronBank assets.
   * @param addresses filter, if not provided all assets are returned
   * @param overrides
   * @returns static
   */
  async assetsStatic(addresses?: Address[], overrides: CallOverrides = {}): Promise<IronBankMarketStatic[]> {
    if (addresses) {
      return await this.contract.read["assetsStatic(address[])"](addresses, overrides).then(structArray);
    }
    return await this.contract.read["assetsStatic()"](overrides).then(structArray);
  }

  /**
   * Get the dynamic part of IronBank assets.
   * @param addresses filter, if not provided all assets are returned
   * @param overrides
   * @returns dynamic
   */
  async assetsDynamic(addresses?: Address[], overrides: CallOverrides = {}): Promise<IronBankMarketDynamic[]> {
    if (addresses) {
      return await this.contract.read["assetsDynamic(address[])"](addresses, overrides).then(structArray);
    }
    return await this.contract.read["assetsDynamic()"](overrides).then(structArray);
  }

  /**
   * Get all IronBankMarket asset positions for a particular address.
   * @param address
   * @param addresses filter, if not provided all positions are returned
   * @param overrides
   * @returns
   */
  async positionsOf(address: Address, addresses?: Address[], overrides: CallOverrides = {}): Promise<Position[]> {
    if (addresses) {
      return await this.contract.read["assetsPositionsOf(address,address[])"](address, addresses, overrides).then(
        structArray
      );
    }
    return await this.contract.read["assetsPositionsOf(address)"](address, overrides).then(structArray);
  }

  /**
   * Get the IronBank Position for a particular address.
   * @param address
   * @param overrides
   * @returns
   */
  async generalPositionOf(address: Address, overrides: CallOverrides = {}): Promise<IronBankPosition> {
    return await this.contract.read.adapterPositionOf(address, overrides).then(struct);
  }

  /**
   * Get the IronBank User Metadata for a particular address.
   * @param address
   * @param overrides
   * @returns
   */
  async assetsUserMetadata(address: Address, overrides: CallOverrides = {}): Promise<CyTokenUserMetadata[]> {
    return await this.contract.read.assetsUserMetadata(address, overrides).then(structArray);
  }

  /**
   * Get all IronBank underlying token addresses.
   * @param overrides
   * @returns
   */
  async tokens(overrides: CallOverrides = {}): Promise<Address[]> {
    return await this.contract.read.assetsTokensAddresses(overrides);
  }
}
