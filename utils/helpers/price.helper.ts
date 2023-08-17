import { Contract, EventLog, JsonRpcProvider } from "ethers";
import { abiSrg20 } from "../constants/abis/abiSRG20";
import { blockTimeEth, secInHour } from "../constants/constvar";
import { toMilli } from "./global.helper";
require("dotenv").config();

export const timeSerializerHour = (currentTimestamp: number) => {
  const currentDate = new Date(currentTimestamp);
  const utcTimestamp = Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(),
    currentDate.getUTCHours(),
    0,
    0,
    0
  );
  return utcTimestamp;
};

export const getGenesisBlock = async (
  srg20_Contract: Contract,
  provider: JsonRpcProvider
) => {
  try {
    const result: EventLog[] = (await srg20_Contract.queryFilter(
      "OwnershipTransferred"
    )) as EventLog[];
    const blockGen = await provider.getBlock(result[0].blockNumber);
    return {
      blockNumber: result[0].blockNumber,
      timestamp: blockGen?.timestamp as number,
    };
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
    const calculatePrice = await srg20_Contract.calculatePrice({
      blockTag: blockTag,
    });
    const factorSrgPrice = 10 ** 15;
    const srgPrice = await srg20_Contract.getSRGPrice({ blockTag: blockTag });
    return (
      (Number(srgPrice) / factorSrgPrice) * (Number(calculatePrice) / padding)
    );
  } catch (error) {
    throw Error("retrievePrice failed :" + error);
  }
};

export const getPresetArray = (startTime: number) => {
  try {
    const secInHourMilli = toMilli(secInHour);

    const endTime = timeSerializerHour(Date.now());
    const amountDaysFromGen = (endTime - startTime) / secInHourMilli;

    const data = new Array(amountDaysFromGen).fill(0);

    return data;
  } catch (error) {
    throw Error("getPresetArray failed :" + error);
  }
};

export const retrieveArrayPrice = async (
  provider: JsonRpcProvider,
  srg20_Contract: Contract,
  blockGen: { blockNumber: number; timestamp: number }
) => {
  try {
    const blocksPerHour = secInHour / blockTimeEth;
    const secInHourMilli = toMilli(secInHour);
    const startTime = timeSerializerHour(
      toMilli(blockGen.timestamp) + secInHourMilli
    );

    let blockNumberStart = blockGen.blockNumber + blocksPerHour;
    const data = getPresetArray(startTime);
    const latestBlock = await provider.getBlockNumber();
    const blockNumberFinality = (15 * 60) / blockTimeEth;

    const promises = data.map(async (element, index) => {
      if (
        latestBlock - blockNumberFinality >
        blockNumberStart + index * blocksPerHour
      ) {
        const srgPrice = await retrievePrice(
          srg20_Contract,
          blockNumberStart + index * blocksPerHour
        );
        return [startTime + index * secInHourMilli, srgPrice];
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

export const getPriceSrg20Engine = async (addressSRGToken: string) => {
  try {
    const provider = new JsonRpcProvider(process.env.RPC_URL_MAINNET);

    const srg20_Contract = new Contract(addressSRGToken, abiSrg20, provider);

    const blockGen = await getGenesisBlock(srg20_Contract, provider);
    const dataArray = (
      await retrieveArrayPrice(provider, srg20_Contract, blockGen)
    ).sort((a, b) => a[0] - b[0]);

    return dataArray;
  } catch (error) {
    throw Error("getPriceSrg20Engine failed :" + error);
  }
};
