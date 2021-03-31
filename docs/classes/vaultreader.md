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
- [ctx](vaultreader.md#ctx)
- [events](vaultreader.md#events)
- [yearn](vaultreader.md#yearn)

### Methods

- [get](vaultreader.md#get)
- [getPositionsOf](vaultreader.md#getpositionsof)
- [getTokens](vaultreader.md#gettokens)

## Constructors

### constructor

\+ **new VaultReader**<T\>(`yearn`: [*Yearn*](yearn.md)<T\>, `chainId`: T, `ctx`: *Context*): [*VaultReader*](vaultreader.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *1* \| *250* |

#### Parameters:

Name | Type |
:------ | :------ |
`yearn` | [*Yearn*](yearn.md)<T\> |
`chainId` | T |
`ctx` | *Context* |

**Returns:** [*VaultReader*](vaultreader.md)<T\>

Inherited from: void

Defined in: [common.ts:66](https://github.com/yearn/yearn-sdk/blob/92195f7/src/common.ts#L66)

## Properties

### chainId

• **chainId**: *1* \| *250*

Inherited from: void

Defined in: [common.ts:19](https://github.com/yearn/yearn-sdk/blob/92195f7/src/common.ts#L19)

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

### yearn

• `Protected` **yearn**: [*Yearn*](yearn.md)<T\>

Inherited from: void

Defined in: [common.ts:66](https://github.com/yearn/yearn-sdk/blob/92195f7/src/common.ts#L66)

## Methods

### get

▸ **get**(): *Promise*<[*Asset*](../modules.md#asset)[]\>

**Returns:** *Promise*<[*Asset*](../modules.md#asset)[]\>

Defined in: [readers/vault.ts:6](https://github.com/yearn/yearn-sdk/blob/92195f7/src/readers/vault.ts#L6)

___

### getPositionsOf

▸ **getPositionsOf**(`address`: *string*): *Promise*<[*Position*](../interfaces/position.md)[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |

**Returns:** *Promise*<[*Position*](../interfaces/position.md)[]\>

Defined in: [readers/vault.ts:24](https://github.com/yearn/yearn-sdk/blob/92195f7/src/readers/vault.ts#L24)

___

### getTokens

▸ **getTokens**(): *Promise*<[*Token*](../interfaces/token.md)[]\>

**Returns:** *Promise*<[*Token*](../interfaces/token.md)[]\>

Defined in: [readers/vault.ts:15](https://github.com/yearn/yearn-sdk/blob/92195f7/src/readers/vault.ts#L15)
