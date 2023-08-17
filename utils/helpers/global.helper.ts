import { Blockchain, blockchainEnum } from "./types/global.type";

export const toMilli = (timestamp: number) => {
  try {
    return timestamp * 1000;
  } catch (error) {
    throw Error("toMilli failed :" + error);
  }
};

export const getRpcUrl = (blockchain: Blockchain) => {
  try {
    const rpcUrl =
      blockchain === blockchainEnum.mainnet
        ? process.env.RPC_URL_MAINNET
        : blockchain === blockchainEnum.arbitrum
        ? process.env.RPC_URL_ARBITRUM
        : process.env.RPC_URL_BNBCHAIN;
    return rpcUrl;
  } catch (error) {
    throw Error("toMilli failed :" + error);
  }
};

export const getBlockTime = (blockchain: Blockchain) => {
  try {
    const blocktime =
      blockchain === blockchainEnum.mainnet
        ? 12
        : blockchain === blockchainEnum.arbitrum
        ? 1
        : 5;

    return blocktime;
  } catch (error) {
    throw Error("getBlockTime failed :" + error);
  }
};
