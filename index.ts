import express, { Express, Request, Response } from "express";
import { getPriceSrg20Engine } from "./utils/helpers/price.helper";
import { volumeEngine } from "./utils/helpers/volume.helper";
import { geLiquiditySrg20Engine } from "./utils/helpers/liquidity.helper";
import { Blockchain } from "./utils/helpers/types/global.type";
const port = process.env.PORT || 6002;

const app = express();

app.get("/prices", async (req, res) => {
  const addressSRGToken = req.query.address as string;
  const blockchain = req.query.blockchain as Blockchain;

  if (!addressSRGToken || !blockchain) {
    return res.status(400).json({ error: "Missing  parameter" });
  }
  try {
    const startTime = Date.now();
    const arrayPrices = await getPriceSrg20Engine(addressSRGToken, blockchain);
    const endTime = Date.now();
    const elapsedTimeInSeconds = (endTime - startTime) / 1000;
    console.log("elapsedTimeInSeconds prices", elapsedTimeInSeconds);
    res.send(arrayPrices);
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/volumes", async (req, res) => {
  const addressSRGToken = req.query.address as string;
  const blockchain = req.query.blockchain as Blockchain;

  if (!addressSRGToken || !blockchain) {
    return res.status(400).json({ error: "Missing parameter" });
  }
  try {
    const startTime = Date.now();
    const arrayVolumes = await volumeEngine(addressSRGToken, blockchain);
    const endTime = Date.now();
    const elapsedTimeInSeconds = (endTime - startTime) / 1000;
    console.log("elapsedTimeInSeconds volumes ", elapsedTimeInSeconds);
    res.send(arrayVolumes);
  } catch (error) {
    console.error("Error fetching volumes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/liquidities", async (req, res) => {
  const addressSRGToken = req.query.address as string;
  const blockchain = req.query.blockchain as Blockchain;

  if (!addressSRGToken || !blockchain) {
    return res.status(400).json({ error: "Missing  parameter" });
  }
  try {
    const startTime = Date.now();
    const arrayLiquities = await geLiquiditySrg20Engine(
      addressSRGToken,
      blockchain
    );
    const endTime = Date.now();
    const elapsedTimeInSeconds = (endTime - startTime) / 1000;
    console.log("elapsedTimeInSeconds liquidities ", elapsedTimeInSeconds);
    res.send(arrayLiquities);
  } catch (error) {
    console.error("Error fetching liquidities:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => console.log("Server running on port 6002"));

const main = async () => {};

main();
