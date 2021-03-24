[@yfi/sdk](README.md) / Exports

# @yfi/sdk

Welcome to the Yearn SDK documentation.

## Modules

SDK is divided in modules representing the different services offered by
yearn and the access method used to read / write from them.

- [Lens](classes/lens.md) provides access to yearn's assets and user position.
- [Oracle](classes/oracle.md) is the main pricing engine used for all calculations.

## Peer dependencies

SDK requires several dependencies from the ethers.js project.

## Table of contents

### Classes

- [Lens](classes/lens.md)
- [Oracle](classes/oracle.md)
- [Yearn](classes/yearn.md)

### Interfaces

- [Asset](interfaces/asset.md)
- [Position](interfaces/position.md)

### Type aliases

- [ChainId](modules.md#chainid)

## Type aliases

### ChainId

Ƭ **ChainId**: keyof *typeof* Chains

Defined in: [chain.ts:6](https://github.com/yearn/yearn-sdk/blob/d93eb22/src/chain.ts#L6)
