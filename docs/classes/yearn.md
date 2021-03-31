[@yfi/sdk](../README.md) / [Exports](../modules.md) / Yearn

# Class: Yearn<T\>

## Type parameters

Name | Type |
:------ | :------ |
`T` | [*ChainId*](../modules.md#chainid) |

## Table of contents

### Constructors

- [constructor](yearn.md#constructor)

### Properties

- [services](yearn.md#services)
- [vaults](yearn.md#vaults)

## Constructors

### constructor

\+ **new Yearn**<T\>(`chainId`: T, `context`: *Context* \| *Partial*<IContext\>): [*Yearn*](yearn.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *1* \| *250* |

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | T |
`context` | *Context* \| *Partial*<IContext\> |

**Returns:** [*Yearn*](yearn.md)<T\>

Defined in: [yearn.ts:15](https://github.com/yearn/yearn-sdk/blob/92195f7/src/yearn.ts#L15)

## Properties

### services

• **services**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`lens` | [*LensService*](lensservice.md)<T\> |
`oracle` | [*OracleService*](oracleservice.md)<T\> |
`zapper` | *ZapperService* |

Defined in: [yearn.ts:9](https://github.com/yearn/yearn-sdk/blob/92195f7/src/yearn.ts#L9)

___

### vaults

• **vaults**: [*VaultReader*](vaultreader.md)<T\>

Defined in: [yearn.ts:15](https://github.com/yearn/yearn-sdk/blob/92195f7/src/yearn.ts#L15)
