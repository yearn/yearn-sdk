[@yfi/sdk](../README.md) / [Exports](../modules.md) / VaultReader

# Class: VaultReader<T\>

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*ChainId*](../modules.md#chainid) |

## Hierarchy

* *Reader*<T\>

  ↳ **VaultReader**

## Table of contents

### Constructors

- [constructor](vaultreader.md#constructor)

### Properties

- [chainId](vaultreader.md#chainid)
- [events](vaultreader.md#events)
- [provider](vaultreader.md#provider)
- [yearn](vaultreader.md#yearn)

### Methods

- [getVaultTokens](vaultreader.md#getvaulttokens)
- [getVaults](vaultreader.md#getvaults)

## Constructors

### constructor

\+ **new VaultReader**<T\>(`yearn`: [*Yearn*](yearn.md)<T\>, `chainId`: T, `provider`: *Provider*): [*VaultReader*](vaultreader.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *1* \| *250* |

#### Parameters:

Name | Type |
:------ | :------ |
`yearn` | [*Yearn*](yearn.md)<T\> |
`chainId` | T |
`provider` | *Provider* |

**Returns:** [*VaultReader*](vaultreader.md)<T\>

Inherited from: void

Defined in: [common.ts:80](https://github.com/yearn/yearn-sdk/blob/922cc91/src/common.ts#L80)

## Properties

### chainId

• **chainId**: *1* \| *250*

Inherited from: void

Defined in: [common.ts:33](https://github.com/yearn/yearn-sdk/blob/922cc91/src/common.ts#L33)

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

### yearn

• `Protected` **yearn**: [*Yearn*](yearn.md)<T\>

Inherited from: void

Defined in: [common.ts:80](https://github.com/yearn/yearn-sdk/blob/922cc91/src/common.ts#L80)

## Methods

### getVaultTokens

▸ **getVaultTokens**(): *Promise*<Token[]\>

**Returns:** *Promise*<Token[]\>

Defined in: [readers/vault.ts:15](https://github.com/yearn/yearn-sdk/blob/922cc91/src/readers/vault.ts#L15)

___

### getVaults

▸ **getVaults**(): *Promise*<Asset[]\>

**Returns:** *Promise*<Asset[]\>

Defined in: [readers/vault.ts:6](https://github.com/yearn/yearn-sdk/blob/922cc91/src/readers/vault.ts#L6)
