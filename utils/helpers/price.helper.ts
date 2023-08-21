import { Contract, JsonRpcProvider } from "ethers";
import { abiSrg20 } from "../constants/abis/abiSRG20";
import {
  getBlockTime,
  getPeriodInSeconds,
  getRpcUrl,
  timeSerializer,
  toMilli,
} from "./global.helper";
import { Blockchain, Period } from "./types/global.type";
import { getGenesisBlock } from "./redis.helper";
import { factorSrgPrice, padding } from "../constants/constvar";
import { redisClient } from "../clients/redis.client";
require("dotenv").config();

export const retrievePrice = async (
  srg20_Contract: Contract,
  blockTag: number,
  jsonPrices: any
) => {
  try {
    const calculatePrice = await srg20_Contract.calculatePrice({ blockTag });
    if (!jsonPrices[`${blockTag}`]) {
      const price = await srg20_Contract.getSRGPrice({ blockTag });
      jsonPrices[`${blockTag}`] = Number(price);
      const jsonString = JSON.stringify(jsonPrices);
      redisClient.set("srgPrices", jsonString);
      return (
        (Number(price) / factorSrgPrice) * (Number(calculatePrice) / padding)
      );
    }
    return (
      (jsonPrices[`${blockTag}`] / factorSrgPrice) *
      (Number(calculatePrice) / padding)
    );
  } catch (error) {
    throw Error("retrievePrice failed :" + error);
  }
};

export const getPresetArray = (
  startTime: number,
  periodInSecMili: number,
  period: Period
) => {
  try {
    const endTime = timeSerializer(Date.now(), period);
    const amountPeriodFromGen = (endTime - startTime) / periodInSecMili;

    const data = new Array(amountPeriodFromGen).fill(0);

    return data;
  } catch (error) {
    throw Error("getPresetArray failed :" + error);
  }
};

export const retrieveArrayPrice = async (
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

    const data = getPresetArray(startTime, periodInSecMili, period);
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

    const arrayTest: any = [];
    const promises: Promise<void>[] = [];

    data.forEach((element, index) => {
      if (
        latestBlock - blockNumberFinality >
        blockNumberStart + index * blockPerPeriod
      ) {
        const promise = retrievePrice(
          srg20_Contract,
          blockNumberStart + index * blockPerPeriod,
          jsonPrices
        ).then((result) => {
          if (result !== undefined) {
            arrayTest.push([startTime + index * periodInSecMili, result]);
          }
        });
        promises.push(promise);
      }
    });

    const array: [number][] = await Promise.all(promises).then(() => {
      return arrayTest;
    });

    return array;
  } catch (error) {
    throw Error("retrieveArrayPrice failed :" + error);
  }
};

export const getPriceSrg20Engine = async (
  addressSRGToken: string,
  blockchain: Blockchain,
  period: Period
) => {
  try {
    const rpcUrl = getRpcUrl(blockchain);

    const provider = new JsonRpcProvider(rpcUrl);

    const srg20_Contract = new Contract(addressSRGToken, abiSrg20, provider);

    const blockGen = await getGenesisBlock(
      srg20_Contract,
      provider,
      addressSRGToken
    );

    const dataArray = (
      await retrieveArrayPrice(
        provider,
        srg20_Contract,
        blockGen,
        blockchain,
        period
      )
    ).sort((a, b) => a[0] - b[0]);

    return dataArray;
  } catch (error) {
    throw Error("getPriceSrg20Engine failed :" + error);
  }
};
