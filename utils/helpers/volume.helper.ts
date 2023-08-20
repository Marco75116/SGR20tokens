import { Contract, EventLog, JsonRpcProvider } from "ethers";
import { abiSrg20 } from "../constants/abis/abiSRG20";
import { getRpcUrl, timeSerializer, toMilli } from "./global.helper";
import { Blockchain, DataVolume } from "./types/global.type";
require("dotenv").config();

export const sortFormatData = (dataVolume: DataVolume[]) => {
  try {
    const transformedData = dataVolume
      .sort((a, b) => a.timestamp - b.timestamp)
      .reduce(
        (result, item) => {
          result.volumePeriod.push([item.timestamp, item.volumePeriod]);
          result.swaps.push([item.timestamp, item.swaps]);
          return result;
        },
        {
          volumePeriod: [] as [number, number][],
          swaps: [] as [number, number][],
        }
      );
    return transformedData;
  } catch (error) {
    throw Error("sortFormatData failed :" + error);
  }
};

export const volumeEngine = async (
  addressSRGToken: string,
  blockchain: Blockchain
) => {
  try {
    const rpcUrl = getRpcUrl(blockchain);
    const provider = new JsonRpcProvider(rpcUrl);

    const srg20_Contract = new Contract(addressSRGToken, abiSrg20, provider);
    const pastEvents: EventLog[] = (await srg20_Contract.queryFilter(
      "*"
    )) as EventLog[];
    const factor = 10 ** 24;

    const dataVolume: DataVolume[] = [];

    await Promise.all(
      pastEvents.map(async (event) => {
        if (!event.removed) {
          if (event.eventName === "Bought" || event.eventName === "Sold") {
            const block = await provider.getBlock(event.blockNumber);

            const swapSize = Number(event.args[4]) / factor;

            const existTimestamp = dataVolume.find((data) => {
              return (
                data.timestamp ===
                timeSerializer(toMilli(Number(block?.timestamp)), "d")
              );
            });
            if (existTimestamp) {
              existTimestamp.volumePeriod += swapSize;
              existTimestamp.swaps += 1;
            } else {
              dataVolume.push({
                timestamp: timeSerializer(
                  toMilli(Number(block?.timestamp)),
                  "d"
                ),
                volumePeriod: swapSize,
                swaps: 1,
              });
            }
          }
        }
      })
    );

    return sortFormatData(dataVolume);
  } catch (error) {
    throw Error("getPriceSrg20Engine failed :" + error);
  }
};
