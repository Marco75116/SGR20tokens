import { Contract, EventLog, JsonRpcProvider } from "ethers";
import { abiSrg20 } from "../constants/abis/abiSRG20";
import { toMilli } from "./global.helper";
import { DataVolume } from "./types/global.type";
require("dotenv").config();

export const timeSerializerDay = (currentTimestamp: number) => {
  const currentDate = new Date(currentTimestamp);
  const utcTimestamp = Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(),
    0,
    0,
    0,
    0
  );

  return utcTimestamp;
};

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

export const volumeEngine = async (addressSRGToken: string) => {
  try {
    const provider = new JsonRpcProvider(process.env.RPC_URL_MAINNET);

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
                timeSerializerDay(toMilli(Number(block?.timestamp)))
              );
            });
            if (existTimestamp) {
              existTimestamp.volumePeriod += swapSize;
              existTimestamp.swaps += 1;
            } else {
              dataVolume.push({
                timestamp: timeSerializerDay(toMilli(Number(block?.timestamp))),
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
