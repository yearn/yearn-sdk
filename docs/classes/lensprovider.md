[@yfi/sdk](../README.md) / [Exports](../modules.md) / LensProvider

# Class: LensProvider<T\>

Lens module provides access to all yearn's assets and user positions.
It's implemented in the form of a contract that lives on all networks
supported by yearn.

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*ChainId*](../modules.md#chainid) |

## Hierarchy

* *ContractProvider*

  ↳ **LensProvider**

## Table of contents

### Constructors

- [constructor](lensprovider.md#constructor)

### Properties

- [address](lensprovider.md#address)
- [chainId](lensprovider.md#chainid)
- [contract](lensprovider.md#contract)
- [events](lensprovider.md#events)
- [provider](lensprovider.md#provider)
- [abi](lensprovider.md#abi)

### Accessors

- [adapters](lensprovider.md#adapters)

### Methods

- [getAssets](lensprovider.md#getassets)
- [getAssetsFromAdapter](lensprovider.md#getassetsfromadapter)
- [getPositions](lensprovider.md#getpositions)
- [getRegistries](lensprovider.md#getregistries)
- [addressByChain](lensprovider.md#addressbychain)

## Constructors

### constructor

\+ **new LensProvider**<T\>(`chainId`: T, `provider`: *Provider*): [*LensProvider*](lensprovider.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *1* \| *250* |

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | T |
`provider` | *Provider* |

**Returns:** [*LensProvider*](lensprovider.md)<T\>

Overrides: void

Defined in: [providers/lens.ts:36](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/lens.ts#L36)

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

Defined in: [providers/lens.ts:36](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/lens.ts#L36)

## Accessors

### adapters

• get **adapters**(): *Adapters*<T\>

**Returns:** *Adapters*<T\>

Defined in: [providers/lens.ts:42](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/lens.ts#L42)

## Methods

### getAssets

▸ **getAssets**(): *Promise*<Asset[]\>

**Returns:** *Promise*<Asset[]\>

Defined in: [providers/lens.ts:72](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/lens.ts#L72)

___

### getAssetsFromAdapter

▸ **getAssetsFromAdapter**(`adapter`: *string*): *Promise*<Asset[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`adapter` | *string* |

**Returns:** *Promise*<Asset[]\>

Defined in: [providers/lens.ts:76](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/lens.ts#L76)

___

### getPositions

▸ **getPositions**(`address`: *string*): *Promise*<Position[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |

**Returns:** *Promise*<Position[]\>

Defined in: [providers/lens.ts:80](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/lens.ts#L80)

___

### getRegistries

▸ **getRegistries**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [providers/lens.ts:68](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/lens.ts#L68)

___

### addressByChain

▸ `Static`**addressByChain**(`chainId`: *1* \| *250*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | *1* \| *250* |

**Returns:** *string*

Defined in: [providers/lens.ts:60](https://github.com/yearn/yearn-sdk/blob/922cc91/src/providers/lens.ts#L60)
