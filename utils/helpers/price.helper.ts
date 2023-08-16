import { Contract, EventLog, JsonRpcProvider } from "ethers";
import { abiSrg20 } from "../constants/abis/abiSRG20";
import { timeSerializer } from "./volume.helper";
import { blockTimeEth, secInDay } from "../constants/constvar";
import { toMilli } from "./global.helper";
require("dotenv").config();

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
    const factorDecimals = 10 ** 9;
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
    const secInDayMilli = toMilli(secInDay);

    const endTime = timeSerializer(Date.now());
    const amountDaysFromGen = (endTime - startTime) / secInDayMilli;

    const data = new Array(amountDaysFromGen).fill(0);

    return data;
  } catch (error) {
    throw Error("getPresetArray failed :" + error);
  }
};

export const retrieveArrayPrice = async (
  srg20_Contract: Contract,
  blockGen: { blockNumber: number; timestamp: number }
) => {
  try {
    let blockNumber = blockGen.blockNumber;

    const blocksPerDay = secInDay / blockTimeEth;
    const secInDayMilli = toMilli(secInDay);
    const startTime = timeSerializer(
      toMilli(blockGen.timestamp) + secInDayMilli
    );

    const data = getPresetArray(startTime);

    const promises = data.map(async (element, index) => {
      const srgPrice = await retrievePrice(
        srg20_Contract,
        blockNumber + index * blocksPerDay
      );
      return [startTime + index * secInDayMilli, srgPrice];
    });

    const array = await Promise.all(promises);

    return array;
  } catch (error) {
    throw Error("retrieveArrayPrice failed :" + error);
  }
};

export const getPriceSrg20Engine = async () => {
  try {
    const provider = new JsonRpcProvider(process.env.RPC_URL_MAINNET);
    const addressSRGToken = "0x4E6908fC4Fb8E97222f694Dc92B71743f615B2e9";

    const srg20_Contract = new Contract(addressSRGToken, abiSrg20, provider);

    const blockGen = await getGenesisBlock(srg20_Contract, provider);
    const dataArray = (await retrieveArrayPrice(srg20_Contract, blockGen)).sort(
      (a, b) => a[0] - b[0]
    );

    return dataArray;
  } catch (error) {
    throw Error("getPriceSrg20Engine failed :" + error);
  }
};
