export type DataVolume = {
  timestamp: number;
  volumePeriod: number;
  swaps: number;
};

export const blockchainEnum = {
  mainnet: "mainnet",
  bnbchain: "bnbchain",
  arbitrum: "arbitrum",
} as const;

export type Blockchain = (typeof blockchainEnum)[keyof typeof blockchainEnum];
