[@yfi/sdk](README.md) / Exports

# @yfi/sdk

Welcome to the Yearn SDK documentation.

## Modules

SDK is divided in modules representing the different services offered by
yearn and the access method used to read / write from them.

- [LensProvider](classes/lensprovider.md) provides access to yearn's assets and user position.
- [OracleProvider](classes/oracleprovider.md) is the main pricing engine used for all calculations.

## Peer dependencies

SDK requires several dependencies from the ethers.js project.

## Table of contents

### Classes

- [LensProvider](classes/lensprovider.md)
- [OracleProvider](classes/oracleprovider.md)
- [VaultReader](classes/vaultreader.md)
- [Yearn](classes/yearn.md)

### Type aliases

- [ChainId](modules.md#chainid)

## Type aliases

### ChainId

Ƭ **ChainId**: keyof *typeof* Chains

Defined in: [chain.ts:12](https://github.com/yearn/yearn-sdk/blob/e3d9954/src/chain.ts#L12)
