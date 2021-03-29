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

- [get](vaultreader.md#get)
- [getPositionsOf](vaultreader.md#getpositionsof)
- [getTokens](vaultreader.md#gettokens)

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

Defined in: [common.ts:73](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/common.ts#L73)

## Properties

### chainId

• **chainId**: *1* \| *250*

Inherited from: void

Defined in: [common.ts:26](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/common.ts#L26)

___

### events

• **events**: *EventEmitter*

Inherited from: void

Defined in: [common.ts:28](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/common.ts#L28)

___

### provider

• **provider**: *Provider*

Inherited from: void

Defined in: [common.ts:25](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/common.ts#L25)

___

### yearn

• `Protected` **yearn**: [*Yearn*](yearn.md)<T\>

Inherited from: void

Defined in: [common.ts:73](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/common.ts#L73)

## Methods

### get

▸ **get**(): *Promise*<Asset[]\>

**Returns:** *Promise*<Asset[]\>

Defined in: [readers/vault.ts:6](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/readers/vault.ts#L6)

___

### getPositionsOf

▸ **getPositionsOf**(`address`: *string*): *Promise*<Position[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |

**Returns:** *Promise*<Position[]\>

Defined in: [readers/vault.ts:24](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/readers/vault.ts#L24)

___

### getTokens

▸ **getTokens**(): *Promise*<Token[]\>

**Returns:** *Promise*<Token[]\>

Defined in: [readers/vault.ts:15](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/readers/vault.ts#L15)
