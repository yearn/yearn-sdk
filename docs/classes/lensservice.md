[@yfi/sdk](../README.md) / [Exports](../modules.md) / LensService

# Class: LensService<T\>

Lens module provides access to all yearn's assets and user positions.
It's implemented in the form of a contract that lives on all networks
supported by yearn.

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*ChainId*](../modules.md#chainid) |

## Hierarchy

* *ContractService*

  ↳ **LensService**

## Table of contents

### Constructors

- [constructor](lensservice.md#constructor)

### Properties

- [address](lensservice.md#address)
- [chainId](lensservice.md#chainid)
- [contract](lensservice.md#contract)
- [ctx](lensservice.md#ctx)
- [events](lensservice.md#events)
- [abi](lensservice.md#abi)

### Accessors

- [adapters](lensservice.md#adapters)

### Methods

- [getAssets](lensservice.md#getassets)
- [getAssetsFromAdapter](lensservice.md#getassetsfromadapter)
- [getPositions](lensservice.md#getpositions)
- [getRegistries](lensservice.md#getregistries)
- [addressByChain](lensservice.md#addressbychain)

## Constructors

### constructor

\+ **new LensService**<T\>(`chainId`: T, `ctx`: *Context*): [*LensService*](lensservice.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *1* \| *250* |

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | T |
`ctx` | *Context* |

**Returns:** [*LensService*](lensservice.md)<T\>

Overrides: void

Defined in: [services/lens.ts:35](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/lens.ts#L35)

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

Defined in: [services/lens.ts:35](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/lens.ts#L35)

## Accessors

### adapters

• get **adapters**(): *Adapters*<T\>

**Returns:** *Adapters*<T\>

Defined in: [services/lens.ts:41](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/lens.ts#L41)

## Methods

### getAssets

▸ **getAssets**(): *Promise*<[*Asset*](../modules.md#asset)[]\>

**Returns:** *Promise*<[*Asset*](../modules.md#asset)[]\>

Defined in: [services/lens.ts:71](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/lens.ts#L71)

___

### getAssetsFromAdapter

▸ **getAssetsFromAdapter**(`adapter`: *string*): *Promise*<[*Asset*](../modules.md#asset)[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`adapter` | *string* |

**Returns:** *Promise*<[*Asset*](../modules.md#asset)[]\>

Defined in: [services/lens.ts:75](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/lens.ts#L75)

___

### getPositions

▸ **getPositions**(`address`: *string*): *Promise*<[*Position*](../interfaces/position.md)[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |

**Returns:** *Promise*<[*Position*](../interfaces/position.md)[]\>

Defined in: [services/lens.ts:79](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/lens.ts#L79)

___

### getRegistries

▸ **getRegistries**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [services/lens.ts:67](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/lens.ts#L67)

___

### addressByChain

▸ `Static`**addressByChain**(`chainId`: *1* \| *250*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | *1* \| *250* |

**Returns:** *string*

Defined in: [services/lens.ts:59](https://github.com/yearn/yearn-sdk/blob/92195f7/src/services/lens.ts#L59)
