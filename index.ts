import express, { Express, Request, Response } from "express";
import { getPriceSrg20Engine } from "./utils/helpers/price.helper";
import { volumeEngine } from "./utils/helpers/volume.helper";
const port = process.env.PORT || 6002;

const app = express();

app.get("/prices", async (req, res) => {
  const addressSRGToken = req.query.address as string;

  // Check if the required parameter exists
  if (!addressSRGToken) {
    return res.status(400).json({ error: "Missing address parameter" });
  }
  try {
    const addressSRGToken = req.query.address as string;
    const startTime = Date.now();
    const array = await getPriceSrg20Engine(addressSRGToken);
    const endTime = Date.now();
    const elapsedTimeInSeconds = (endTime - startTime) / 1000;
    console.log("elapsedTimeInSeconds prices", elapsedTimeInSeconds);
    res.send(array);
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/volumes", async (req, res) => {
  const addressSRGToken = req.query.address as string;

  if (!addressSRGToken) {
    return res.status(400).json({ error: "Missing address parameter" });
  }
  try {
    const addressSRGToken = req.query.address as string;
    const startTime = Date.now();
    const array = await volumeEngine(addressSRGToken);
    const endTime = Date.now();
    const elapsedTimeInSeconds = (endTime - startTime) / 1000;
    console.log("elapsedTimeInSeconds volumes ", elapsedTimeInSeconds);
    res.send(array);
  } catch (error) {
    console.error("Error fetching volumes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => console.log("Server running on port 6002"));

const main = async () => {};

main();
