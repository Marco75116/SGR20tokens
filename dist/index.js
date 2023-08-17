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
const port = process.env.PORT || 6002;
const app = (0, express_1.default)();
app.get("/prices", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const addressSRGToken = req.query.address;
    // Check if the required parameter exists
    if (!addressSRGToken) {
        return res.status(400).json({ error: "Missing address parameter" });
    }
    try {
        const addressSRGToken = req.query.address;
        const startTime = Date.now();
        const array = yield (0, price_helper_1.getPriceSrg20Engine)(addressSRGToken);
        const endTime = Date.now();
        const elapsedTimeInSeconds = (endTime - startTime) / 1000;
        console.log("elapsedTimeInSeconds prices", elapsedTimeInSeconds);
        res.send(array);
    }
    catch (error) {
        console.error("Error fetching prices:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.get("/volumes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const addressSRGToken = req.query.address;
    if (!addressSRGToken) {
        return res.status(400).json({ error: "Missing address parameter" });
    }
    try {
        const addressSRGToken = req.query.address;
        const startTime = Date.now();
        const array = yield (0, volume_helper_1.volumeEngine)(addressSRGToken);
        const endTime = Date.now();
        const elapsedTimeInSeconds = (endTime - startTime) / 1000;
        console.log("elapsedTimeInSeconds volumes ", elapsedTimeInSeconds);
        res.send(array);
    }
    catch (error) {
        console.error("Error fetching volumes:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.listen(port, () => console.log("Server running on port 6002"));
const main = () => __awaiter(void 0, void 0, void 0, function* () { });
main();
