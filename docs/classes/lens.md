[@yfi/sdk](../README.md) / [Exports](../modules.md) / Lens

# Class: Lens

Lens module provides access to all yearn's assets and user positions.
It's implemented in the form of a contract that lives on all networks
supported by yearn.

## Hierarchy

* *Addressable*

  ↳ **Lens**

## Table of contents

### Constructors

- [constructor](lens.md#constructor)

### Properties

- [address](lens.md#address)
- [chainId](lens.md#chainid)
- [contract](lens.md#contract)
- [provider](lens.md#provider)
- [abi](lens.md#abi)

### Methods

- [getAssets](lens.md#getassets)
- [getPositions](lens.md#getpositions)
- [getRegistries](lens.md#getregistries)
- [addressByChain](lens.md#addressbychain)

## Constructors

### constructor

\+ **new Lens**(`chainId`: *number*, `provider`: *Provider*): [*Lens*](lens.md)

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | *number* |
`provider` | *Provider* |

**Returns:** [*Lens*](lens.md)

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

Defined in: [lens.ts:31](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/lens.ts#L31)

## Methods

### getAssets

▸ **getAssets**(): *Promise*<[*Asset*](../interfaces/asset.md)[]\>

**Returns:** *Promise*<[*Asset*](../interfaces/asset.md)[]\>

Defined in: [lens.ts:47](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/lens.ts#L47)

___

### getPositions

▸ **getPositions**(`address`: *string*): *Promise*<[*Position*](../interfaces/position.md)[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |

**Returns:** *Promise*<[*Position*](../interfaces/position.md)[]\>

Defined in: [lens.ts:51](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/lens.ts#L51)

___

### getRegistries

▸ **getRegistries**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

Defined in: [lens.ts:43](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/lens.ts#L43)

___

### addressByChain

▸ `Static`**addressByChain**(`chainId`: *1* \| *250*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | *1* \| *250* |

**Returns:** *string*

Overrides: void

Defined in: [lens.ts:33](https://github.com/yearn/yearn-sdk/blob/bb487b1/src/lens.ts#L33)
