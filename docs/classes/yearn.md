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

- [providers](yearn.md#providers)
- [vaults](yearn.md#vaults)

## Constructors

### constructor

\+ **new Yearn**<T\>(`chainId`: T, `provider`: *Provider*): [*Yearn*](yearn.md)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *1* \| *250* |

#### Parameters:

Name | Type |
:------ | :------ |
`chainId` | T |
`provider` | *Provider* |

**Returns:** [*Yearn*](yearn.md)<T\>

Defined in: [yearn.ts:14](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/yearn.ts#L14)

## Properties

### providers

• **providers**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`lens` | [*LensProvider*](lensprovider.md)<T\> |
`oracle` | [*OracleProvider*](oracleprovider.md)<T\> |

Defined in: [yearn.ts:9](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/yearn.ts#L9)

___

### vaults

• **vaults**: [*VaultReader*](vaultreader.md)<T\>

Defined in: [yearn.ts:14](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/yearn.ts#L14)
