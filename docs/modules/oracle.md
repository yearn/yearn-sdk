[@yfi/sdk](../README.md) / [Exports](../modules.md) / oracle

# Namespace: oracle

## Table of contents

### Variables

- [OracleAbi](oracle.md#oracleabi)
- [OracleAddress](oracle.md#oracleaddress)

### Functions

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

## Variables

### OracleAbi

• `Const` **OracleAbi**: *string*[]

Defined in: [oracle.ts:8](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L8)

___

### OracleAddress

• `Const` **OracleAddress**: *0x9b8b9F6146B29CC32208f42b995E70F0Eb2807F3*= "0x9b8b9F6146B29CC32208f42b995E70F0Eb2807F3"

Defined in: [oracle.ts:7](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L7)

## Functions

### getBasePrice

▸ **getBasePrice**(`lpToken`: Address, `provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | Address |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:74](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L74)

___

### getCalculations

▸ **getCalculations**(`provider`: Provider): *Promise*<Address[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`provider` | Provider |

**Returns:** *Promise*<Address[]\>

Defined in: [oracle.ts:32](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L32)

___

### getCurvePriceUsdc

▸ **getCurvePriceUsdc**(`lpToken`: Address, `provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | Address |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:66](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L66)

___

### getCurveRegistryAddress

▸ **getCurveRegistryAddress**(`provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:98](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L98)

___

### getFirstUnderlyingCoinFromPool

▸ **getFirstUnderlyingCoinFromPool**(`pool`: Address, `provider`: Provider): *Promise*<Address\>

#### Parameters:

Name | Type |
:------ | :------ |
`pool` | Address |
`provider` | Provider |

**Returns:** *Promise*<Address\>

Defined in: [oracle.ts:90](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L90)

___

### getIronBankMarketPriceUsdc

▸ **getIronBankMarketPriceUsdc**(`token`: Address, `provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | Address |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:118](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L118)

___

### getIronBankMarkets

▸ **getIronBankMarkets**(`provider`: Provider): *Promise*<Address[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`provider` | Provider |

**Returns:** *Promise*<Address[]\>

Defined in: [oracle.ts:126](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L126)

___

### getLpTokenPriceUsdc

▸ **getLpTokenPriceUsdc**(`token`: Address, `provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | Address |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:173](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L173)

___

### getLpTokenTotalLiquidityUsdc

▸ **getLpTokenTotalLiquidityUsdc**(`token`: Address, `provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | Address |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:165](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L165)

___

### getPriceFromRouter

▸ **getPriceFromRouter**(`token0`: Address, `token1`: Address, `provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token0` | Address |
`token1` | Address |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:148](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L148)

___

### getPriceFromRouterUsdc

▸ **getPriceFromRouterUsdc**(`token0`: Address, `provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token0` | Address |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:157](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L157)

___

### getPriceUsdcRecommended

▸ **getPriceUsdcRecommended**(`token`: Address, `provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | Address |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:37](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L37)

___

### getUsdcAddress

▸ **getUsdcAddress**(`provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:45](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L45)

___

### getVirtualPrice

▸ **getVirtualPrice**(`lpToken`: Address, `provider`: Provider): *Promise*<BigNumber\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | Address |
`provider` | Provider |

**Returns:** *Promise*<BigNumber\>

Defined in: [oracle.ts:82](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L82)

___

### isCurveLpToken

▸ **isCurveLpToken**(`lpToken`: Address, `provider`: Provider): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`lpToken` | Address |
`provider` | Provider |

**Returns:** *Promise*<boolean\>

Defined in: [oracle.ts:58](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L58)

___

### isIronBankMarket

▸ **isIronBankMarket**(`token`: Address, `provider`: Provider): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | Address |
`provider` | Provider |

**Returns:** *Promise*<boolean\>

Defined in: [oracle.ts:110](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L110)

___

### isLpToken

▸ **isLpToken**(`token`: Address, `provider`: Provider): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`token` | Address |
`provider` | Provider |

**Returns:** *Promise*<boolean\>

Defined in: [oracle.ts:140](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/oracle.ts#L140)
