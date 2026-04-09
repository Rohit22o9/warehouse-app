// routes/weather.routes.js

const express = require("express");
const router = express.Router();
const { getCurrentWeather, getForecast } = require("../controllers/weather.controller");

// GET /api/weather?city=Pune
router.get("/", getCurrentWeather);

// GET /api/weather/forecast?city=Pune
router.get("/forecast", getForecast);

module.exports = router;