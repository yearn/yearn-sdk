import { BigNumber } from "@ethersproject/bignumber";

import { Integer, SdkError, Usdc } from "./types";

export const ZeroAddress = "0x0000000000000000000000000000000000000000";
export const EthAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const WethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

export const pickleJars = [
  "0x1BB74b5DdC1f4fC91D6f9E7906cf68bc93538e33", // 3poolcrv
  "0x68d14d66B2B0d6E157c06Dc8Fefa3D8ba0e66a89", // scrv
  "0x2E35392F4c36EBa7eCAFE4de34199b2373Af22ec", // renbtccrv
  "0x4fFe73Cf2EEf5E8C8E0E10160bCe440a029166D2", // lusdcrv
  "0xEB801AB73E9A2A482aA48CaCA13B1954028F4c94", // usdc
  "0x55282dA27a3a02ffe599f6D11314D239dAC89135", // slp-dai
  "0x8c2D16B7F6D3F989eb4878EcF13D695A7d504E43", // slp-usdc
  "0xa7a37aE5Cb163a3147DE83F15e15D8E5f94D6bCE", // slp-usdt
  "0xde74b6c547bd574c3527316a2eE30cd8F6041525", // slp-wbtc
  "0x3261D9408604CC8607b687980D40135aFA26FfED", // slp-yfi
  "0x77C8A58D940a322Aea02dBc8EE4A30350D4239AD", // stecrv
  "0x5Eff6d166D66BacBC1BF52E2C54dD391AE6b1f48", // yvecrv-eth
  "0x3Bcd97dCA7b1CED292687c97702725F37af01CaC", // mir-ust
  "0xaFB2FE266c215B5aAe9c4a9DaDC325cC7a497230", // mtsla-ust
  "0xF303B35D5bCb4d9ED20fB122F5E268211dEc0EBd", // maapl-ust
  "0x7C8de3eE2244207A54b57f45286c9eE1465fee9f", // mqqq-ust
  "0x1ed1fD33b62bEa268e527A622108fe0eE0104C07", // mslv-ust
  "0x1CF137F651D8f0A4009deD168B442ea2E870323A", // mbaba-ust
  "0xC1513C1b0B359Bc5aCF7b772100061217838768B", // fei-tribe
  "0xECb520217DccC712448338B0BB9b08Ce75AD61AE", // sushi-eth
  "0xCeD67a187b923F0E5ebcc77C7f2F7da20099e378", // yvboost-eth
  "0x927e3bCBD329e89A8765B52950861482f0B227c4", // lusd-eth
  "0x9eb0aAd5Bb943D3b2F7603Deb772faa35f60aDF9", // alcx-eth
  "0xDCfAE44244B3fABb5b351b01Dc9f050E589cF24F", // cvx-eth
  "0x65B2532474f717D5A8ba38078B78106D56118bbb", // lqty
  "0x0519848e57Ba0469AA5275283ec0712c91e20D8E", // dai
  "0x9eD7e3590F2fB9EEE382dfC55c71F9d3DF12556c", // cometh-usdc
  "0x7512105DBb4C0E0432844070a45B7EA0D83a23fD", // cometh-pickle
  "0x91bcc0BBC2ecA760e3b8A79903CbA53483A7012C", // cometh-matic
  "0x261b5619d85B710f1c2570b65ee945975E2cC221", // am3crv
  "0x80aB65b1525816Ffe4222607EDa73F86D211AC95", // pslp-usdt
  "0xd438Ba7217240a378238AcE3f44EFaaaF8aaC75A", // pslp-matic
  "0x74dC9cdCa9a96Fd0B7900e6eb953d1EA8567c3Ce", // qlp-mimatic
  "0xCbA1FE4Fdbd90531EFD929F1A1831F38e91cff1e", // aleth
  "0x729C6248f9B1Ce62B3d5e31D4eE7EE95cAB32dfD" // fraxcrv
];

// handle a non-200 `fetch` response.
export async function handleHttpError(response: Response): Promise<Response> {
  if (response.status !== 200) {
    const { url, status, statusText } = response;
    throw new SdkError(`HTTP to ${url} request failed (status ${status} ${statusText})`);
  }
  return response;
}

// formally convert USD values to USDC values (* 1e6), using Usdc type alias.
export function usdc(usd: any): Usdc {
  return BigNumber.from(Math.floor(Number(usd) * 1e6)).toString();
}

// formally convert BigNumber to Integer type alias.
export function int(value: BigNumber): Integer {
  return value.toString();
}
