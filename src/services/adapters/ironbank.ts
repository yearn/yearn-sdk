import { BigNumber as EthersBigNumber } from "@ethersproject/bignumber";
import { CallOverrides } from "@ethersproject/contracts";
import { BigNumber } from "bignumber.js";

import { AdapterAbi } from "../../abi";
import { ChainId } from "../../chain";
import { ContractAddressId, ContractService } from "../../common";
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
  uint256 totalCollateralTokens,
  uint256 collateralFactor,
  uint256 collateralCap,
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
  static contractId = ContractAddressId.adapter_ironbank;

  get contract() {
    return this._getContract(IronBankAdapter.abi, IronBankAdapter.contractId, this.ctx);
  }

  /**
   * Get the static part of IronBank assets.
   * @param addresses filter, if not provided all assets are returned
   * @param overrides
   * @returns static
   */
  async assetsStatic(addresses?: Address[], overrides: CallOverrides = {}): Promise<IronBankMarketStatic[]> {
    const contract = await this.contract;
    if (addresses) {
      return contract.read["assetsStatic(address[])"](addresses, overrides).then(structArray);
    }
    return contract.read["assetsStatic()"](overrides).then(structArray);
  }

  /**
   * Get the dynamic part of IronBank assets.
   * @param addresses filter, if not provided all assets are returned
   * @param overrides
   * @returns dynamic
   */
  async assetsDynamic(addresses?: Address[], overrides: CallOverrides = {}): Promise<IronBankMarketDynamic[]> {
    const contract = await this.contract;
    const assetsPromise: Promise<IronBankMarketDynamic[]> = addresses
      ? contract.read["assetsDynamic(address[])"](addresses, overrides).then(structArray)
      : contract.read["assetsDynamic()"](overrides).then(structArray);

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
    const contract = await this.contract;
    if (addresses) {
      return contract.read["assetsPositionsOf(address,address[])"](address, addresses, overrides).then(structArray);
    }
    return contract.read["assetsPositionsOf(address)"](address, overrides).then(structArray);
  }

  /**
   * Get the IronBank Position for a particular address.
   * @param address
   * @param overrides
   * @returns
   */
  async generalPositionOf(address: Address, overrides: CallOverrides = {}): Promise<IronBankUserSummary> {
    const contract = await this.contract;
    return contract.read.adapterPositionOf(address, overrides).then(struct);
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
    const contract = await this.contract;
    if (addresses) {
      return contract.read["assetsUserMetadata(address,address[])"](address, addresses, overrides).then(structArray);
    }
    return contract.read["assetsUserMetadata(address)"](address, overrides).then(structArray);
  }

  /**
   * Get all IronBank underlying token addresses.
   * @param overrides
   * @returns
   */
  async tokens(overrides: CallOverrides = {}): Promise<Address[]> {
    const contract = await this.contract;
    return contract.read.assetsTokensAddresses(overrides);
  }

  async blocksPerYear(overrides: CallOverrides = {}): Promise<Integer> {
    const contract = await this.contract;
    const blocks: EthersBigNumber = await contract.read["blocksPerYear"](overrides);
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
