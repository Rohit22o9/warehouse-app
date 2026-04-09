// controllers/weather.controller.js

const {
    getWeatherByCity,
    getWeatherForecast,
} = require("../services/weather.service");

const getCurrentWeather = async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) return res.status(400).json({ error: "City is required" });

        const weather = await getWeatherByCity(city);
        res.json({ success: true, data: weather });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getForecast = async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) return res.status(400).json({ error: "City is required" });

        const forecast = await getWeatherForecast(city);
        res.json({ success: true, data: forecast });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getCurrentWeather, getForecast };