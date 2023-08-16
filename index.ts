import express, { Express, Request, Response } from "express";
import { getPriceSrg20Engine } from "./utils/helpers/price.helper";
import { volumeEngine } from "./utils/helpers/volume.helper";
const port = process.env.PORT || 6002;

const app = express();

app.get("/prices", async (req, res) => {
  const startTime = Date.now();
  const array = await getPriceSrg20Engine();
  const endTime = Date.now();
  const elapsedTimeInSeconds = (endTime - startTime) / 1000;
  console.log("elapsedTimeInSeconds prices", elapsedTimeInSeconds);
  res.send(array);
});

app.get("/volumes", async (req, res) => {
  const startTime = Date.now();
  const array = await volumeEngine();
  const endTime = Date.now();
  const elapsedTimeInSeconds = (endTime - startTime) / 1000;
  console.log("elapsedTimeInSeconds volumes ", elapsedTimeInSeconds);
  res.send(array);
});

app.listen(port, () => console.log("Server running on port 6002"));

const main = async () => {};

main();
