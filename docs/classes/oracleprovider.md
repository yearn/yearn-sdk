[@yfi/sdk](../README.md) / [Exports](../modules.md) / OracleProvider

# Class: OracleProvider<T\>

Oracle is the main pricing engine, used by all price calculations.
It's implemented in the form of a contract that lives on all networks
supported by yearn.

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*ChainId*](../modules.md#chainid) |

## Hierarchy

* *ContractProvider*

  ↳ **OracleProvider**

## Table of contents

### Constructors

- [constructor](oracleprovider.md#constructor)

### Properties

- [address](oracleprovider.md#address)
- [chainId](oracleprovider.md#chainid)
- [contract](oracleprovider.md#contract)
- [events](oracleprovider.md#events)
- [provider](oracleprovider.md#provider)
- [abi](oracleprovider.md#abi)

### Methods

- [getBasePrice](oracleprovider.md#getbaseprice)
- [getCalculations](oracleprovider.md#getcalculations)
- [getCurvePriceUsdc](oracleprovider.md#getcurvepriceusdc)
- [getCurveRegistryAddress](oracleprovider.md#getcurveregistryaddress)
- [getFirstUnderlyingCoinFromPool](oracleprovider.md#getfirstunderlyingcoinfrompool)
- [getIronBankMarketPriceUsdc](oracleprovider.md#getironbankmarketpriceusdc)
- [getIronBankMarkets](oracleprovider.md#getironbankmarkets)
- [getLpTokenPriceUsdc](oracleprovider.md#getlptokenpriceusdc)
- [getLpTokenTotalLiquidityUsdc](oracleprovider.md#getlptokentotalliquidityusdc)
- [getPriceFromRouter](oracleprovider.md#getpricefromrouter)
- [getPriceFromRouterUsdc](oracleprovider.md#getpricefromrouterusdc)
- [getPriceUsdcRecommended](oracleprovider.md#getpriceusdcrecommended)
- [getUsdcAddress](oracleprovider.md#getusdcaddress)
- [getVirtualPrice](oracleprovider.md#getvirtualprice)
- [isCurveLpToken](oracleprovider.md#iscurvelptoken)
- [isIronBankMarket](oracleprovider.md#isironbankmarket)
- [isLpToken](oracleprovider.md#islptoken)
- [addressByChain](oracleprovider.md#addressbychain)

## Constructors

### constructor

\+ **new OracleProvider**<T\>(`chainId`: T, `provider`: *Provider*): [*OracleProvider*](oracleprovider.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *1* \| *250* |

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | T |
`provider` | *Provider* |

**Returns:** [*OracleProvider*](oracleprovider.md)<T\>

Overrides: void

Defined in: [providers/oracle.ts:37](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L37)

## Properties

### address

• **address**: *string*

Inherited from: void

Defined in: [common.ts:91](https://github.com/yearn/yearn-sdk/blob/922cc91/src/common.ts#L91)

___

### chainId

• **chainId**: *1* \| *250*

Inherited from: void

Defined in: [common.ts:33](https://github.com/yearn/yearn-sdk/blob/922cc91/src/common.ts#L33)

___

### contract

• **contract**: *Contract*

Inherited from: void

Defined in: [common.ts:93](https://github.com/yearn/yearn-sdk/blob/922cc91/src/common.ts#L93)

___

### events

• **events**: *EventEmitter*

Inherited from: void

Defined in: [common.ts:35](https://github.com/yearn/yearn-sdk/blob/922cc91/src/common.ts#L35)

___

### provider

• **provider**: *Provider*

Inherited from: void

Defined in: [common.ts:32](https://github.com/yearn/yearn-sdk/blob/922cc91/src/common.ts#L32)

___

### abi

▪ `Static` **abi**: *string*[]

Overrides: void

Defined in: [providers/oracle.ts:37](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L37)

## Methods

### getBasePrice

▸ **getBasePrice**(`lpToken`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:80](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L80)

___

### getCalculations

▸ **getCalculations**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [providers/oracle.ts:52](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L52)

___

### getCurvePriceUsdc

▸ **getCurvePriceUsdc**(`lpToken`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:76](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L76)

___

### getCurveRegistryAddress

▸ **getCurveRegistryAddress**(): *Promise*<BigNumber\>

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:92](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L92)

___

### getFirstUnderlyingCoinFromPool

▸ **getFirstUnderlyingCoinFromPool**(`pool`: *string*): *Promise*<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`pool` | *string* |

**Returns:** *Promise*<string\>

Defined in: [providers/oracle.ts:88](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L88)

___

### getIronBankMarketPriceUsdc

▸ **getIronBankMarketPriceUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:105](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L105)

___

### getIronBankMarkets

▸ **getIronBankMarkets**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [providers/oracle.ts:109](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L109)

___

### getLpTokenPriceUsdc

▸ **getLpTokenPriceUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:139](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L139)

___

### getLpTokenTotalLiquidityUsdc

▸ **getLpTokenTotalLiquidityUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:135](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L135)

___

### getPriceFromRouter

▸ **getPriceFromRouter**(`token0`: *string*, `token1`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token0` | *string* |
`token1` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:124](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L124)

___

### getPriceFromRouterUsdc

▸ **getPriceFromRouterUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:131](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L131)

___

### getPriceUsdcRecommended

▸ **getPriceUsdcRecommended**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:56](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L56)

___

### getUsdcAddress

▸ **getUsdcAddress**(): *Promise*<BigNumber\>

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:60](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L60)

___

### getVirtualPrice

▸ **getVirtualPrice**(`lpToken`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [providers/oracle.ts:84](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L84)

___

### isCurveLpToken

▸ **isCurveLpToken**(`lpToken`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: [providers/oracle.ts:72](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L72)

___

### isIronBankMarket

▸ **isIronBankMarket**(`token`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: [providers/oracle.ts:101](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L101)

___

### isLpToken

▸ **isLpToken**(`token`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: [providers/oracle.ts:120](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L120)

___

### addressByChain

▸ `Static`**addressByChain**(`chainId`: *1* \| *250*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | *1* \| *250* |

**Returns:** *string*

Defined in: [providers/oracle.ts:43](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/oracle.ts#L43)
