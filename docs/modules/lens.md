[@yfi/sdk](../README.md) / [Exports](../modules.md) / lens

# Namespace: lens

## Table of contents

### Interfaces

- [Asset](../interfaces/lens.asset.md)
- [Position](../interfaces/lens.position.md)

### Variables

- [LensAbi](lens.md#lensabi)
- [LensAddress](lens.md#lensaddress)

### Functions

- [getAssets](lens.md#getassets)
- [getPositions](lens.md#getpositions)
- [getRegistries](lens.md#getregistries)

## Variables

### LensAbi

• `Const` **LensAbi**: *string*[]

Defined in: [lens.ts:8](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/lens.ts#L8)

___

### LensAddress

• `Const` **LensAddress**: *0xFa58130BE296EDFA23C42a1d15549fA91449F979*= "0xFa58130BE296EDFA23C42a1d15549fA91449F979"

Defined in: [lens.ts:7](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/lens.ts#L7)

## Functions

### getAssets

▸ **getAssets**(`provider`: Provider): *Promise*<[*Asset*](../interfaces/lens.asset.md)[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`provider` | Provider |

**Returns:** *Promise*<[*Asset*](../interfaces/lens.asset.md)[]\>

Defined in: [lens.ts:32](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/lens.ts#L32)

___

### getPositions

▸ **getPositions**(`address`: *string*, `provider`: Provider): *Promise*<[*Position*](../interfaces/lens.position.md)[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |
`provider` | Provider |

**Returns:** *Promise*<[*Position*](../interfaces/lens.position.md)[]\>

Defined in: [lens.ts:37](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/lens.ts#L37)

___

### getRegistries

▸ **getRegistries**(`provider`: Provider): *Promise*<string[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`provider` | Provider |

**Returns:** *Promise*<string[]\>

Defined in: [lens.ts:27](https://github.com/yearn/yearn-sdk/blob/a34c5e7/src/lens.ts#L27)
