[@yfi/sdk](../README.md) / [Exports](../modules.md) / Oracle

# Class: Oracle

Oracle is the main pricing engine, used by all price calculations.
It's implemented in the form of a contract that lives on all networks
supported by yearn.

## Hierarchy

* *Addressable*

  ↳ **Oracle**

## Table of contents

### Constructors

- [constructor](oracle.md#constructor)

### Properties

- [address](oracle.md#address)
- [chainId](oracle.md#chainid)
- [contract](oracle.md#contract)
- [provider](oracle.md#provider)
- [abi](oracle.md#abi)

### Methods

- [getBasePrice](oracle.md#getbaseprice)
- [getCalculations](oracle.md#getcalculations)
- [getCurvePriceUsdc](oracle.md#getcurvepriceusdc)
- [getCurveRegistryAddress](oracle.md#getcurveregistryaddress)
- [getFirstUnderlyingCoinFromPool](oracle.md#getfirstunderlyingcoinfrompool)
- [getIronBankMarketPriceUsdc](oracle.md#getironbankmarketpriceusdc)
- [getIronBankMarkets](oracle.md#getironbankmarkets)
- [getLpTokenPriceUsdc](oracle.md#getlptokenpriceusdc)
- [getLpTokenTotalLiquidityUsdc](oracle.md#getlptokentotalliquidityusdc)
- [getPriceFromRouter](oracle.md#getpricefromrouter)
- [getPriceFromRouterUsdc](oracle.md#getpricefromrouterusdc)
- [getPriceUsdcRecommended](oracle.md#getpriceusdcrecommended)
- [getUsdcAddress](oracle.md#getusdcaddress)
- [getVirtualPrice](oracle.md#getvirtualprice)
- [isCurveLpToken](oracle.md#iscurvelptoken)
- [isIronBankMarket](oracle.md#isironbankmarket)
- [isLpToken](oracle.md#islptoken)
- [addressByChain](oracle.md#addressbychain)

## Constructors

### constructor

\+ **new Oracle**(`chainId`: *number*, `provider`: *Provider*): [*Oracle*](oracle.md)

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | *number* |
`provider` | *Provider* |

**Returns:** [*Oracle*](oracle.md)

Inherited from: void

Defined in: [common.ts:27](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/common.ts#L27)

## Properties

### address

• **address**: *string*

Inherited from: void

Defined in: [common.ts:23](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/common.ts#L23)

___

### chainId

• **chainId**: *number*

Inherited from: void

Defined in: [common.ts:24](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/common.ts#L24)

___

### contract

• **contract**: *Contract*

Inherited from: void

Defined in: [common.ts:27](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/common.ts#L27)

___

### provider

• **provider**: *Provider*

Inherited from: void

Defined in: [common.ts:25](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/common.ts#L25)

___

### abi

▪ `Static` **abi**: *string*[]

Overrides: void

Defined in: [oracle.ts:36](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L36)

## Methods

### getBasePrice

▸ **getBasePrice**(`lpToken`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:78](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L78)

___

### getCalculations

▸ **getCalculations**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [oracle.ts:50](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L50)

___

### getCurvePriceUsdc

▸ **getCurvePriceUsdc**(`lpToken`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:74](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L74)

___

### getCurveRegistryAddress

▸ **getCurveRegistryAddress**(): *Promise*<BigNumber\>

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:90](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L90)

___

### getFirstUnderlyingCoinFromPool

▸ **getFirstUnderlyingCoinFromPool**(`pool`: *string*): *Promise*<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`pool` | *string* |

**Returns:** *Promise*<string\>

Defined in: [oracle.ts:86](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L86)

___

### getIronBankMarketPriceUsdc

▸ **getIronBankMarketPriceUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:103](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L103)

___

### getIronBankMarkets

▸ **getIronBankMarkets**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [oracle.ts:107](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L107)

___

### getLpTokenPriceUsdc

▸ **getLpTokenPriceUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:137](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L137)

___

### getLpTokenTotalLiquidityUsdc

▸ **getLpTokenTotalLiquidityUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:133](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L133)

___

### getPriceFromRouter

▸ **getPriceFromRouter**(`token0`: *string*, `token1`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token0` | *string* |
`token1` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:122](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L122)

___

### getPriceFromRouterUsdc

▸ **getPriceFromRouterUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:129](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L129)

___

### getPriceUsdcRecommended

▸ **getPriceUsdcRecommended**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:54](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L54)

___

### getUsdcAddress

▸ **getUsdcAddress**(): *Promise*<BigNumber\>

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:58](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L58)

___

### getVirtualPrice

▸ **getVirtualPrice**(`lpToken`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:82](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L82)

___

### isCurveLpToken

▸ **isCurveLpToken**(`lpToken`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: [oracle.ts:70](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L70)

___

### isIronBankMarket

▸ **isIronBankMarket**(`token`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: [oracle.ts:99](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L99)

___

### isLpToken

▸ **isLpToken**(`token`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: [oracle.ts:118](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L118)

___

### addressByChain

▸ `Static`**addressByChain**(`chainId`: *1* \| *250*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | *1* \| *250* |

**Returns:** *string*

Overrides: void

Defined in: [oracle.ts:38](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/oracle.ts#L38)
