// services/weather.service.js

const axios = require("axios");

const BASE_URL = "https://api.openweathermap.org/data/2.5";

/**
 * Fetch current weather for a city
 * @param {string} city - City name (e.g., "Pune", "Nagpur")
 * @returns {object} - Formatted weather data
 */
const getWeatherByCity = async (city) => {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) throw new Error("OPENWEATHER_API_KEY is missing in .env");

        const response = await axios.get(`${BASE_URL}/weather`, {
            params: {
                q: city,
                appid: apiKey,
                units: "metric",
                lang: "en",
            },
        });

        const data = response.data;

        return {
            city: data.name,
            state: data.sys?.country,
            temperature: data.main?.temp,
            feelsLike: data.main?.feels_like,
            humidity: data.main?.humidity,
            condition: data.weather?.[0]?.description,
            windSpeed: data.wind?.speed,
            visibility: data.visibility / 1000, // convert to km
            rainChance: data.clouds?.all, // cloud cover %
            sunrise: new Date(data.sys?.sunrise * 1000).toLocaleTimeString("en-IN"),
            sunset: new Date(data.sys?.sunset * 1000).toLocaleTimeString("en-IN"),
        };
    } catch (error) {
        console.error("Weather API Error:", error.response?.data || error.message);
        throw new Error(`Could not fetch weather for "${city}"`);
    }
};

/**
 * Fetch 5-day weather forecast for a city
 * @param {string} city
 * @returns {Array} - Array of forecast objects
 */
const getWeatherForecast = async (city) => {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;

        const response = await axios.get(`${BASE_URL}/forecast`, {
            params: {
                q: city,
                appid: apiKey,
                units: "metric",
                cnt: 5, // next 5 time slots (every 3 hrs)
            },
        });

        return response.data.list.map((item) => ({
            time: item.dt_txt,
            temp: item.main?.temp,
            condition: item.weather?.[0]?.description,
            humidity: item.main?.humidity,
            windSpeed: item.wind?.speed,
        }));
    } catch (error) {
        console.error(
            "Weather Forecast Error:",
            error.response?.data || error.message
        );
        throw new Error(`Could not fetch forecast for "${city}"`);
    }
};

/**
 * Format weather data as a readable string for Gemini context injection
 */
const formatWeatherForGemini = (weather) => {
    return `
Current Weather in ${weather.city}:
- Temperature: ${weather.temperature}°C (Feels like ${weather.feelsLike}°C)
- Condition: ${weather.condition}
- Humidity: ${weather.humidity}%
- Wind Speed: ${weather.windSpeed} m/s
- Cloud Cover: ${weather.rainChance}%
- Visibility: ${weather.visibility} km
- Sunrise: ${weather.sunrise} | Sunset: ${weather.sunset}
  `.trim();
};

module.exports = { getWeatherByCity, getWeatherForecast, formatWeatherForGemini };