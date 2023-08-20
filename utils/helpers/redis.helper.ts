import { Contract, EventLog, JsonRpcProvider } from "ethers";
import { redisClient } from "../clients/redis.client";
import { Period, blockchainEnum } from "./types/global.type";
import {
  getBlockTime,
  getPeriodInSeconds,
  getRpcUrl,
  timeSerializer,
  toMilli,
} from "./global.helper";
import { abiSrg20 } from "../constants/abis/abiSRG20";
import { getPresetArray } from "./price.helper";

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

export const initiateCacheSRGPrice = async (
  blockchain = blockchainEnum.mainnet,
  period: Period = "h"
) => {
  try {
    const rpcUrl = getRpcUrl(blockchain);
    const provider = new JsonRpcProvider(rpcUrl);
    const srg20_Contract = new Contract(
      "0x4E6908fC4Fb8E97222f694Dc92B71743f615B2e9",
      abiSrg20,
      provider
    );
    const blockGen = await getGenesisBlock(srg20_Contract, provider);
    const blockTime = getBlockTime(blockchain);
    const periodInSecMili = toMilli(getPeriodInSeconds(period));
    const blockPerPeriod = periodInSecMili / toMilli(blockTime);

    const startTime = timeSerializer(
      toMilli(blockGen.timestamp) + periodInSecMili,
      period
    );
    const blockNumberStart = Number(blockGen.blockNumber + blockPerPeriod);
    const data = getPresetArray(startTime, periodInSecMili, period);
    const latestBlock = await provider.getBlockNumber();
    const blockNumberFinality = (15 * 60) / blockTime;

    const jsonPrice: any = {};

    await Promise.all(
      data.map(async (element, index) => {
        if (latestBlock > blockNumberStart + index * blockPerPeriod) {
          const deb = blockNumberStart + index * blockPerPeriod;
          console.log(deb);
          const price = await srg20_Contract.getSRGPrice({ blockTag: deb });
          jsonPrice[`${deb}`] = Number(price);
        }
      })
    );

    const jsonString = JSON.stringify(jsonPrice);
    redisClient.set("srgPrices", jsonString);
  } catch (error) {
    throw error;
  }
};
