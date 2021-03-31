[@yfi/sdk](../README.md) / [Exports](../modules.md) / OracleService

# Class: OracleService<T\>

Oracle is the main pricing engine, used by all price calculations.
It's implemented in the form of a contract that lives on all networks
supported by yearn.

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*ChainId*](../modules.md#chainid) |

## Hierarchy

* *ContractService*

  ↳ **OracleService**

## Table of contents

### Constructors

- [constructor](oracleservice.md#constructor)

### Properties

- [address](oracleservice.md#address)
- [chainId](oracleservice.md#chainid)
- [contract](oracleservice.md#contract)
- [ctx](oracleservice.md#ctx)
- [events](oracleservice.md#events)
- [abi](oracleservice.md#abi)

### Methods

- [getBasePrice](oracleservice.md#getbaseprice)
- [getCalculations](oracleservice.md#getcalculations)
- [getCurvePriceUsdc](oracleservice.md#getcurvepriceusdc)
- [getCurveRegistryAddress](oracleservice.md#getcurveregistryaddress)
- [getFirstUnderlyingCoinFromPool](oracleservice.md#getfirstunderlyingcoinfrompool)
- [getIronBankMarketPriceUsdc](oracleservice.md#getironbankmarketpriceusdc)
- [getIronBankMarkets](oracleservice.md#getironbankmarkets)
- [getLpTokenPriceUsdc](oracleservice.md#getlptokenpriceusdc)
- [getLpTokenTotalLiquidityUsdc](oracleservice.md#getlptokentotalliquidityusdc)
- [getPriceFromRouter](oracleservice.md#getpricefromrouter)
- [getPriceFromRouterUsdc](oracleservice.md#getpricefromrouterusdc)
- [getPriceUsdcRecommended](oracleservice.md#getpriceusdcrecommended)
- [getUsdcAddress](oracleservice.md#getusdcaddress)
- [getVirtualPrice](oracleservice.md#getvirtualprice)
- [isCurveLpToken](oracleservice.md#iscurvelptoken)
- [isIronBankMarket](oracleservice.md#isironbankmarket)
- [isLpToken](oracleservice.md#islptoken)
- [addressByChain](oracleservice.md#addressbychain)

## Constructors

### constructor

\+ **new OracleService**<T\>(`chainId`: T, `ctx`: *Context*): [*OracleService*](oracleservice.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *1* \| *250* |

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | T |
`ctx` | *Context* |

**Returns:** [*OracleService*](oracleservice.md)<T\>

Overrides: void

Defined in: [services/oracle.ts:37](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L37)

## Properties

### address

• **address**: *string*

Inherited from: void

Defined in: [common.ts:77](https://github.com/yearn/yearn-sdk/blob/92195f7/src/common.ts#L77)

___

### chainId

• **chainId**: *1* \| *250*

Inherited from: void

Defined in: [common.ts:19](https://github.com/yearn/yearn-sdk/blob/92195f7/src/common.ts#L19)

___

### contract

• **contract**: *Contract*

Inherited from: void

Defined in: [common.ts:79](https://github.com/yearn/yearn-sdk/blob/92195f7/src/common.ts#L79)

___

### ctx

• **ctx**: *Context*

Inherited from: void

Defined in: [common.ts:18](https://github.com/yearn/yearn-sdk/blob/92195f7/src/common.ts#L18)

___

### events

• **events**: *EventEmitter*

Inherited from: void

Defined in: [common.ts:21](https://github.com/yearn/yearn-sdk/blob/92195f7/src/common.ts#L21)

___

### abi

▪ `Static` **abi**: *string*[]

Overrides: void

Defined in: [services/oracle.ts:37](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L37)

## Methods

### getBasePrice

▸ **getBasePrice**(`lpToken`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:80](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L80)

___

### getCalculations

▸ **getCalculations**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [services/oracle.ts:52](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L52)

___

### getCurvePriceUsdc

▸ **getCurvePriceUsdc**(`lpToken`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:76](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L76)

___

### getCurveRegistryAddress

▸ **getCurveRegistryAddress**(): *Promise*<BigNumber\>

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:92](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L92)

___

### getFirstUnderlyingCoinFromPool

▸ **getFirstUnderlyingCoinFromPool**(`pool`: *string*): *Promise*<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`pool` | *string* |

**Returns:** *Promise*<string\>

Defined in: [services/oracle.ts:88](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L88)

___

### getIronBankMarketPriceUsdc

▸ **getIronBankMarketPriceUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:105](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L105)

___

### getIronBankMarkets

▸ **getIronBankMarkets**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [services/oracle.ts:109](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L109)

___

### getLpTokenPriceUsdc

▸ **getLpTokenPriceUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:139](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L139)

___

### getLpTokenTotalLiquidityUsdc

▸ **getLpTokenTotalLiquidityUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:135](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L135)

___

### getPriceFromRouter

▸ **getPriceFromRouter**(`token0`: *string*, `token1`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token0` | *string* |
`token1` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:124](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L124)

___

### getPriceFromRouterUsdc

▸ **getPriceFromRouterUsdc**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:131](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L131)

___

### getPriceUsdcRecommended

▸ **getPriceUsdcRecommended**(`token`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:56](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L56)

___

### getUsdcAddress

▸ **getUsdcAddress**(): *Promise*<BigNumber\>

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:60](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L60)

___

### getVirtualPrice

▸ **getVirtualPrice**(`lpToken`: *string*): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<BigNumber\>

Defined in: [services/oracle.ts:84](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L84)

___

### isCurveLpToken

▸ **isCurveLpToken**(`lpToken`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: [services/oracle.ts:72](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L72)

___

### isIronBankMarket

▸ **isIronBankMarket**(`token`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: [services/oracle.ts:101](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L101)

___

### isLpToken

▸ **isLpToken**(`token`: *string*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | *string* |

**Returns:** *Promise*<boolean\>

Defined in: [services/oracle.ts:120](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L120)

___

### addressByChain

▸ `Static`**addressByChain**(`chainId`: *1* \| *250*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | *1* \| *250* |

**Returns:** *string*

Defined in: [services/oracle.ts:43](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/oracle.ts#L43)
