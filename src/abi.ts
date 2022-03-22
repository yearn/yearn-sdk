/**
 * Storing ABIs in Human-Readable ABI format.
 * https://blog.ricmoo.com/human-readable-contract-abis-in-ethers-js-141902f4d917
 */

export const TokenAbi = "tuple(address address, string name, string symbol, uint256 decimals)";
export const TokenPriceAbi = "tuple(address address, uint256 priceUsdc)";
export const TokenBalanceAbi = `tuple(
  address address, 
  uint256 priceUsdc, 
  uint256 balance,
  uint256 balanceUsdc
)`;
export const AllowanceAbi = "tuple(address owner, address spender, uint256 amount, address token)";

export const AssetStaticAbi = `tuple(
  address address,
  string typeId,
  address token,
  string name,
  string version,
  string symbol,
  uint8 decimals,
)`;

export const AssetDynamicAbi = (Metadata: string): string => `tuple(
  address address, 
  string typeId,
  address tokenId,
  tuple(uint256 amount, uint256 amountUsdc) underlyingTokenBalance,
  ${Metadata} metadata
)`;

export const PositionAbi =
  "tuple(address assetAddress, address tokenAddress, string typeId, uint256 balance," +
  "tuple(uint256 amount, uint256 amountUsdc) underlyingTokenBalance," +
  "tuple(address owner, address spender, uint256 amount)[] tokenAllowances," +
  "tuple(address owner, address spender, uint256 amount)[] assetAllowances)";

export const AdapterAbi = (Metadata: string): string[] => [
  `function assetsStatic() public view returns (${AssetStaticAbi}[] memory)`,
  `function assetsStatic(address[] memory) public view returns (${AssetStaticAbi}[] memory)`,
  `function assetsDynamic() public view returns (${AssetDynamicAbi(Metadata)}[] memory)`,
  `function assetsDynamic(address[] memory) public view returns (${AssetDynamicAbi(Metadata)}[] memory)`,
  `function assetsPositionsOf(address) public view returns (${PositionAbi}[] memory)`,
  `function assetsPositionsOf(address, address[] memory) public view returns (${PositionAbi}[] memory)`,
  `function assetsTokensAddresses() public view returns (address[] memory)`
];

export const AddressMetadataAbi = `tuple(string addrId, address addr)`;
