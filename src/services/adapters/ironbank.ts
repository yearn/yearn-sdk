import { BigNumber as EthersBigNumber } from "@ethersproject/bignumber";
import { CallOverrides } from "@ethersproject/contracts";
import { BigNumber } from "bignumber.js";

import { AdapterAbi } from "../../abi";
import { ChainId } from "../../chain";
import { ContractService } from "../../common";
import { Context } from "../../context";
import { struct, structArray } from "../../struct";
import {
  Address,
  CyTokenUserMetadata,
  Integer,
  IronBankMarketDynamic,
  IronBankMarketStatic,
  IronBankUserSummary,
  Position
} from "../../types";

const CyTokenMetadataAbi = `tuple(
  uint256 totalSuppliedUsdc,
  uint256 totalBorrowedUsdc,
  uint256 lendAprBips,
  uint256 borrowAprBips,
  uint256 liquidity,
  uint256 liquidityUsdc,
  uint256 totalCollateralTokens;
  uint256 collateralFactor,
  uint256 collateralCap;
  bool isActive,
  uint256 reserveFactor,
  uint256 exchangeRate
)`;

const CyTokenUserMetadataAbi = `tuple(
  address assetAddress,
  bool enteredMarket,
  uint256 supplyBalanceUsdc,
  uint256 borrowBalanceUsdc,
  uint256 collateralBalanceUsdc,
  uint256 borrowLimitUsdc
)`;

const IronBankUserSummaryAbi = `tuple(
  uint256 supplyBalanceUsdc,
  uint256 borrowBalanceUsdc,
  uint256 borrowLimitUsdc,
  uint256 utilizationRatioBips
)`;

const CustomAbi = [
  `function adapterPositionOf(address) external view returns (${IronBankUserSummaryAbi} memory)`,
  `function assetsUserMetadata(address) public view returns (${CyTokenUserMetadataAbi}[] memory)`,
  `function blocksPerYear() public view returns (uint256)`
];

export class IronBankAdapter<T extends ChainId> extends ContractService<T> {
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
      case 250:
        return "0x8CafAF31Ee6374C02EedF1AD68dDb193dDAC29A2";
      case 42161:
        return "0xf900ea42c55D165Ca5d5f50883CddD352AE48F40";
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
    const assetsPromise: Promise<IronBankMarketDynamic[]> = addresses
      ? this.contract.read["assetsDynamic(address[])"](addresses, overrides).then(structArray)
      : this.contract.read["assetsDynamic()"](overrides).then(structArray);

    const [assets, blocksPerYear] = await Promise.all([assetsPromise, this.blocksPerYear()]);
    for (const asset of assets) {
      asset.metadata.lendApyBips = this.aprBipsToApyBips(asset.metadata.lendAprBips, blocksPerYear);
      asset.metadata.borrowApyBips = this.aprBipsToApyBips(asset.metadata.borrowAprBips, blocksPerYear);
    }
    return assets;
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
  async generalPositionOf(address: Address, overrides: CallOverrides = {}): Promise<IronBankUserSummary> {
    return await this.contract.read.adapterPositionOf(address, overrides).then(struct);
  }

  /**
   * Get the IronBank User Metadata for a particular address.
   * @param address
   * @param overrides
   * @returns
   */
  async assetsUserMetadata(
    address: Address,
    addresses?: Address[],
    overrides: CallOverrides = {}
  ): Promise<CyTokenUserMetadata[]> {
    if (addresses) {
      return await this.contract.read["assetsUserMetadata(address,address[])"](address, addresses, overrides).then(
        structArray
      );
    }
    return await this.contract.read["assetsUserMetadata(address)"](address, overrides).then(structArray);
  }

  /**
   * Get all IronBank underlying token addresses.
   * @param overrides
   * @returns
   */
  async tokens(overrides: CallOverrides = {}): Promise<Address[]> {
    return await this.contract.read.assetsTokensAddresses(overrides);
  }

  async blocksPerYear(overrides: CallOverrides = {}): Promise<Integer> {
    const blocks: EthersBigNumber = await this.contract.read["blocksPerYear"](overrides);
    return blocks.toString();
  }

  private aprBipsToApyBips(aprBips: Integer, period: Integer): Integer {
    const bn = BigNumber.clone({ POW_PRECISION: 6 });
    const apy = new bn(aprBips)
      .div(new bn(10).pow(4))
      .div(period)
      .plus(1)
      .pow(period)
      .minus(1)
      .multipliedBy(new bn(10).pow(4))
      .toFixed(0);

    return apy;
  }
}
