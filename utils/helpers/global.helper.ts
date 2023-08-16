export const toMilli = (timestamp: number) => {
  try {
    return timestamp * 1000;
  } catch (error) {
    throw Error("toMilli failed :" + error);
  }
};
