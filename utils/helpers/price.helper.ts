import { Contract, EventLog, JsonRpcProvider } from "ethers";
import { abiSrg20 } from "../constants/abis/abiSRG20";
import {
  getBlockTime,
  getPeriodInSeconds,
  getRpcUrl,
  toMilli,
} from "./global.helper";
import { Blockchain, Period } from "./types/global.type";
import { redisClient } from "../clients/redis.client";
require("dotenv").config();

export const timeSerializer = (currentTimestamp: number, period: Period) => {
  const currentDate = new Date(currentTimestamp);
  const utcTimestamp = Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(),
    period === "d" ? 0 : currentDate.getUTCHours(),
    0,
    0,
    0
  );
  return utcTimestamp;
};

export const getGenesisBlock = async (
  srg20_Contract: Contract,
  provider: JsonRpcProvider
): Promise<{ blockNumber: number; timestamp: number }> => {
  try {
    const cache = await redisClient.get("blockGen");

    if (cache) {
      return JSON.parse(cache);
    } else {
      const result: EventLog[] = (await srg20_Contract.queryFilter(
        "OwnershipTransferred"
      )) as EventLog[];
      const blockGen = await provider.getBlock(result[0].blockNumber);
      const jsonBlockGen = {
        blockNumber: result[0].blockNumber,
        timestamp: blockGen?.timestamp as number,
      };
      const jsonString = JSON.stringify(jsonBlockGen);
      redisClient.set("blockGen", jsonString);

      return jsonBlockGen;
    }
  } catch (error) {
    throw Error("getGenesisBlock failed :" + error);
  }
};

export const retrievePrice = async (
  srg20_Contract: Contract,
  blockTag: number
) => {
  try {
    const padding = 10 ** 18;
    const factorSrgPrice = 10 ** 15;
    const calculatePrice = await srg20_Contract.calculatePrice({
      blockTag: blockTag,
    });
    const srgPrice = await srg20_Contract.getSRGPrice({ blockTag: blockTag });
    return (
      (Number(srgPrice) / factorSrgPrice) * (Number(calculatePrice) / padding)
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
    const latestBlock = await provider.getBlockNumber();
    const blockNumberFinality = (15 * 60) / blockTime;

    const promises = data.map(async (element, index) => {
      if (
        latestBlock - blockNumberFinality >
        blockNumberStart + index * blockPerPeriod
      ) {
        const srgPrice = await retrievePrice(
          srg20_Contract,
          blockNumberStart + index * blockPerPeriod
        );
        return [startTime + index * periodInSecMili, srgPrice];
      }
    });

    const array = await Promise.all(promises);
    const filteredArray = array.filter((element) => element !== undefined) as [
      number
    ][];

    return filteredArray;
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

    const blockGen = await getGenesisBlock(srg20_Contract, provider);
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
