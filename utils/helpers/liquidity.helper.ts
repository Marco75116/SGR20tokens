import { Contract, JsonRpcProvider } from "ethers";
import { abiSrg20 } from "../constants/abis/abiSRG20";
import {
  getGenesisBlock,
  getPresetArray,
  timeSerializerHour,
} from "./price.helper";
import { secInHour } from "../constants/constvar";
import { getBlockTime, getRpcUrl, toMilli } from "./global.helper";
import { Blockchain } from "./types/global.type";

export const retrieveArrayLiquidity = async (
  provider: JsonRpcProvider,
  srg20_Contract: Contract,
  blockGen: { blockNumber: number; timestamp: number },
  blockchain: Blockchain
) => {
  try {
    const blockTime = getBlockTime(blockchain);
    const blocksPerHour = secInHour / blockTime;
    const secInHourMilli = toMilli(secInHour);
    const startTime = timeSerializerHour(
      toMilli(blockGen.timestamp) + secInHourMilli
    );

    let blockNumberStart = blockGen.blockNumber + blocksPerHour;
    const latestBlock = await provider.getBlockNumber();
    const blockNumberFinality = (15 * 60) / blockTime;

    const data = getPresetArray(startTime);

    const promises = data.map(async (element, index) => {
      if (
        latestBlock - blockNumberFinality >
        blockNumberStart + index * blocksPerHour
      ) {
        const liquidityUSD = await retrieveLiquidityUSD(
          srg20_Contract,
          blockNumberStart + index * blocksPerHour
        );
        return [startTime + index * secInHourMilli, liquidityUSD];
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
  blockTag: number
) => {
  try {
    const liquidityFactor = 10 ** 9;
    const initialLiquidity = 10 ** 5;
    const liquidity = await srg20_Contract.getLiquidity({ blockTag: blockTag });
    const srgPrice = await srg20_Contract.getSRGPrice({ blockTag: blockTag });
    const factorSrgPrice = 10 ** 15;
    return (
      (Number(liquidity) / liquidityFactor - initialLiquidity) *
      (Number(srgPrice) / factorSrgPrice)
    );
  } catch (error) {
    throw Error("retrieveLiquidityUSD failed :" + error);
  }
};

export const geLiquiditySrg20Engine = async (
  addressSRGToken: string,
  blockchain: Blockchain
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
      blockchain
    );

    return dataArray;
  } catch (error) {
    throw Error("geLiquiditySrg20Engine failed :" + error);
  }
};
