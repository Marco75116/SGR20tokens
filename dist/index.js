"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const price_helper_1 = require("./utils/helpers/price.helper");
const volume_helper_1 = require("./utils/helpers/volume.helper");
const liquidity_helper_1 = require("./utils/helpers/liquidity.helper");
const port = process.env.PORT || 6002;
const app = (0, express_1.default)();
app.get("/prices", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const addressSRGToken = req.query.address;
    const blockchain = req.query.blockchain;
    const period = req.query.period;
    if (!addressSRGToken || !blockchain || !period) {
        return res.status(400).json({ error: "Missing  parameter" });
    }
    try {
        const startTime = Date.now();
        const arrayPrices = yield (0, price_helper_1.getPriceSrg20Engine)(addressSRGToken, blockchain, period);
        const endTime = Date.now();
        const elapsedTimeInSeconds = (endTime - startTime) / 1000;
        console.log("elapsedTimeInSeconds prices", elapsedTimeInSeconds);
        res.send(arrayPrices);
    }
    catch (error) {
        console.error("Error fetching prices:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.get("/volumes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const addressSRGToken = req.query.address;
    const blockchain = req.query.blockchain;
    if (!addressSRGToken || !blockchain) {
        return res.status(400).json({ error: "Missing parameter" });
    }
    try {
        const startTime = Date.now();
        const arrayVolumes = yield (0, volume_helper_1.volumeEngine)(addressSRGToken, blockchain);
        const endTime = Date.now();
        const elapsedTimeInSeconds = (endTime - startTime) / 1000;
        console.log("elapsedTimeInSeconds volumes ", elapsedTimeInSeconds);
        res.send(arrayVolumes);
    }
    catch (error) {
        console.error("Error fetching volumes:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.get("/liquidities", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const addressSRGToken = req.query.address;
    const blockchain = req.query.blockchain;
    const period = req.query.period;
    if (!addressSRGToken || !blockchain || !period) {
        return res.status(400).json({ error: "Missing  parameter" });
    }
    try {
        const startTime = Date.now();
        const arrayLiquities = yield (0, liquidity_helper_1.geLiquiditySrg20Engine)(addressSRGToken, blockchain, period);
        const endTime = Date.now();
        const elapsedTimeInSeconds = (endTime - startTime) / 1000;
        console.log("elapsedTimeInSeconds liquidities ", elapsedTimeInSeconds);
        res.send(arrayLiquities);
    }
    catch (error) {
        console.error("Error fetching liquidities:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.listen(port, () => console.log("Server running on port 6002"));
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    // initiateCacheSRGPrice();
    // testReadFunction("0x2225c9764fe39001c7cb1cbde25a3443d5caed7b", 16424133);
    // console.log(getBlockStartSerializer(17054510));
});
main();
