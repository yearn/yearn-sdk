import {
  CurveGaugeContract__factory,
  CurveGaugeControllerContract__factory,
  CurveRegistryContract__factory
} from "@contracts/index";
import { Context } from "@data/context";
import { getPrice } from "@protocols/coingecko";
import { BigNumber, toBigNumber } from "@utils/bignumber";
import { estimateBlockPrecise, fetchLatestBlock } from "@utils/block";
import { seconds } from "@utils/time";

import { Apy } from "../interfaces";
import { Apy as VaultApy, calculateApyPps } from "../yearn/vault/apy/common";
import { getPoolFromLpToken } from "./registry";

const registryAddress = "0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c";
// const votingEscrowAddress = "0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2";
const crvAddress = "0xD533a949740bb3306d119CC777fa900bA034cd52";

export type CurvePoolApy = VaultApy<{
  oneMonthSample: number;
}>;

export async function calculatePoolApr(
  lpToken: string,
  ctx: Context
): Promise<number | null> {
  const registry = CurveRegistryContract__factory.connect(
    registryAddress,
    ctx.provider
  );
  const latest = await fetchLatestBlock(ctx);
  const oneMonth = await estimateBlockPrecise(
    latest.timestamp - seconds("1 day"),
    ctx
  );

  const poolAprSamples = await calculateApyPps(
    latest.block,
    oneMonth,
    { oneMonthSample: oneMonth },
    overrides => registry.get_virtual_price_from_lp_token(lpToken, overrides)
  );
  const poolApr = poolAprSamples.oneMonthSample;
  return poolApr;
}

const wbtcAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const renBtcAddress = "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D";
const sbtcAddress = "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6";
const sethAddress = "0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb";
const ethAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const stethAddress = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const btcLikeAddresses = [renBtcAddress, wbtcAddress, sbtcAddress];

const ethLikeAddresses = [sethAddress, ethAddress, wethAddress, stethAddress];

export async function calculateApy(lpToken: string, ctx: Context): Promise<Apy> {
  const registry = CurveRegistryContract__factory.connect(
    registryAddress,
    ctx.provider
  );

  const yearnVeCrvvoterAddress = "0xF147b8125d2ef93FB6965Db97D6746952a133934";
  const poolAddress = await getPoolFromLpToken(lpToken, ctx);
  const gauges = await registry.get_gauges(poolAddress);
  const gaugeAddress = gauges[0][0]; // first gauge

  const gauge = CurveGaugeContract__factory.connect(gaugeAddress, ctx.provider);
  const gaugeControllerAddress = await gauge.controller();
  const gaugeController = CurveGaugeControllerContract__factory.connect(
    gaugeControllerAddress,
    ctx.provider
  );

  const gaugeWorkingSupply = toBigNumber(await gauge.working_supply());
  const gaugeRelativeWeight = toBigNumber(
    await gaugeController.gauge_relative_weight(gaugeAddress)
  );
  const gaugeInflationRate = toBigNumber(await gauge.inflation_rate());
  const poolVirtualPrice = toBigNumber(
    await registry.get_virtual_price_from_lp_token(lpToken)
  );

  const underlyingCoins = await registry.get_underlying_coins(poolAddress);
  const firstUnderlyingCoinAddress = underlyingCoins[0];

  let btcMatch = false;
  let ethMatch = false;
  underlyingCoins.every((tokenAddress: string) => {
    btcMatch = btcLikeAddresses.includes(tokenAddress);
    ethMatch = ethLikeAddresses.includes(tokenAddress);
    if (btcMatch || ethMatch) {
      return false;
    }
    return true;
  });
  let priceOfBaseAsset;
  if (btcMatch) {
    priceOfBaseAsset = await getPrice(wbtcAddress, ["usd"]);
  } else if (ethMatch) {
    priceOfBaseAsset = await getPrice(wethAddress, ["usd"]);
  } else {
    priceOfBaseAsset = await getPrice(firstUnderlyingCoinAddress, ["usd"]);
    priceOfBaseAsset = priceOfBaseAsset || { usd: 1 };
  }

  const priceOfCrv = await getPrice(crvAddress, ["usd"]);

  const yearnWorkingBalance = toBigNumber(
    await gauge.working_balances(yearnVeCrvvoterAddress)
  );
  const yearnGaugeBalance = toBigNumber(
    await gauge.balanceOf(yearnVeCrvvoterAddress)
  );

  const secondsInYear = new BigNumber(86400 * 365);
  const maxBoost = 2.5;
  const inverseMaxBoost = new BigNumber(1 / maxBoost);

  const baseApy = gaugeInflationRate
    .times(gaugeRelativeWeight)
    .times(secondsInYear.div(gaugeWorkingSupply))
    .times(inverseMaxBoost.div(poolVirtualPrice))
    .times(priceOfCrv.usd)
    .div(priceOfBaseAsset.usd);

  let currentBoost = yearnWorkingBalance.div(
    inverseMaxBoost.times(yearnGaugeBalance)
  );
  if (currentBoost.isNaN()) {
    currentBoost = new BigNumber(1);
  }

  const boostedApy = baseApy.times(currentBoost);

  const poolApr = new BigNumber((await calculatePoolApr(lpToken, ctx)) || 0);
  const poolApy = poolApr
    .div(365)
    .plus(1)
    .pow(365 - 1)
    .minus(1);
  const aggregateApy = boostedApy.plus(poolApy);

  const data = {
    baseApy: baseApy.toNumber(),
    currentBoost: currentBoost.toNumber(),
    boostedApy: boostedApy.toNumber(),
    poolApy: poolApy.toNumber(),
    totalApy: aggregateApy.toNumber()
  };

  return {
    recommended: aggregateApy.toNumber(),
    type: "curve",
    composite: true,
    description: "APY mirrors Curve calculations",
    data
  };
}
