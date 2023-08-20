import { Contract, JsonRpcProvider } from "ethers";
import { abiSrg20 } from "../constants/abis/abiSRG20";
import { getPresetArray } from "./price.helper";
import {
  getBlockTime,
  getPeriodInSeconds,
  getRpcUrl,
  timeSerializer,
  toMilli,
} from "./global.helper";
import { Blockchain, Period } from "./types/global.type";
import { getGenesisBlock } from "./redis.helper";
import {
  factorSrgPrice,
  initialLiquidity,
  liquidityFactor,
} from "../constants/constvar";
import { redisClient } from "../clients/redis.client";

export const retrieveArrayLiquidity = async (
  provider: JsonRpcProvider,
  srg20_Contract: Contract,
  blockGen: { blockNumber: number; timestamp: number },
  blockchain: Blockchain,
  period: Period
) => {
  try {
    const blockTime = getBlockTime(blockchain);
    const periodInSecMili = toMilli(getPeriodInSeconds(period));
    const blockPerPeriod = periodInSecMili / toMilli(blockTime);
    const startTime = timeSerializer(
      toMilli(blockGen.timestamp) + periodInSecMili,
      period
    );

    let blockNumberStart = blockGen.blockNumber + blockPerPeriod;
    const latestBlockPromise = provider.getBlockNumber();
    const jsonPricesPromise = redisClient
      .get("srgPrices")
      .then((result: any) => {
        return JSON.parse(result);
      });

    const [latestBlock, jsonPrices] = await Promise.all([
      latestBlockPromise,
      jsonPricesPromise,
    ]);

    const blockNumberFinality = (15 * 60) / blockTime;

    const data = getPresetArray(startTime, periodInSecMili, period);

    const promises = data.map(async (element, index) => {
      if (
        latestBlock - blockNumberFinality >
        blockNumberStart + index * blockPerPeriod
      ) {
        const liquidityUSD = await retrieveLiquidityUSD(
          srg20_Contract,
          blockNumberStart + index * blockPerPeriod,
          jsonPrices
        );
        return [startTime + index * periodInSecMili, liquidityUSD];
      }
    });
    const array = await Promise.all(promises);
    const filteredArray = array.filter((element) => element !== undefined) as [
      number
    ][];

    return filteredArray;
  } catch (error) {
    throw Error("retrieveArrayLiquidity failed :" + error);
  }
};

export const retrieveLiquidityUSD = async (
  srg20_Contract: Contract,
  blockTag: number,
  jsonPrices: any
) => {
  try {
    const liquidity = await srg20_Contract.getLiquidity({
      blockTag: blockTag,
    });

    return (
      (Number(liquidity) / liquidityFactor - initialLiquidity) *
      (jsonPrices[`${blockTag}`] / factorSrgPrice)
    );
  } catch (error) {
    throw Error("retrieveLiquidityUSD failed :" + error);
  }
};

export const geLiquiditySrg20Engine = async (
  addressSRGToken: string,
  blockchain: Blockchain,
  period: Period
) => {
  try {
    const rpcUrl = getRpcUrl(blockchain);

    const provider = new JsonRpcProvider(rpcUrl);

    const srg20_Contract = new Contract(addressSRGToken, abiSrg20, provider);

    const blockGen = await getGenesisBlock(srg20_Contract, provider);
    const dataArray = await retrieveArrayLiquidity(
      provider,
      srg20_Contract,
      blockGen,
      blockchain,
      period
    );

    return dataArray;
  } catch (error) {
    throw Error("geLiquiditySrg20Engine failed :" + error);
  }
};
