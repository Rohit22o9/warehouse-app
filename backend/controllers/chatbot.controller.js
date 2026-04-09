// controllers/chatbot.controller.js

const { sendToGemini } = require("../services/gemini.service");
const { getWeatherByCity, formatWeatherForGemini } = require("../services/weather.service");
const { getMarketPrices, formatMarketForGemini } = require("../services/market.service");

// ─── Intent Detection Keywords ───────────────────────────────────────────────

const WEATHER_KEYWORDS = [
    "weather", "mausam", "temperature", "rain", "barish", "baarish",
    "garmi", "sardi", "thand", "aaj ka mausam", "forecast", "humidity",
    "wind", "hawa", "baarish hogi", "kal ka mausam",
];

const MARKET_KEYWORDS = [
    "price", "bhav", "daam", "rate", "mandi", "market", "bechna",
    "sell", "gehu", "wheat", "tomato", "tamatar", "rice", "chawal",
    "onion", "pyaz", "potato", "aloo", "cotton", "kapas", "soybean",
    "market price", "today price", "aaj ka bhav", "sabzi ka bhav",
];

const detectIntent = (message) => {
    const lower = message.toLowerCase();
    return {
        isWeather: WEATHER_KEYWORDS.some((kw) => lower.includes(kw)),
        isMarket: MARKET_KEYWORDS.some((kw) => lower.includes(kw)),
    };
};

const extractCity = (message) => {
    const cities = [
        "pune", "mumbai", "nagpur", "nashik", "aurangabad", "delhi", "jaipur",
        "lucknow", "patna", "bhopal", "indore", "hyderabad", "bangalore",
        "chennai", "kolkata", "ahmedabad", "surat", "amravati", "latur",
        "solapur", "kolhapur", "akola", "chandrapur",
    ];
    const lower = message.toLowerCase();
    return cities.find((city) => lower.includes(city)) || null;
};

const extractCommodity = (message) => {
    const commodityMap = {
        wheat: "Wheat", gehu: "Wheat",
        rice: "Rice", chawal: "Rice",
        tomato: "Tomato", tamatar: "Tomato",
        onion: "Onion", pyaz: "Onion",
        potato: "Potato", aloo: "Potato",
        cotton: "Cotton", kapas: "Cotton",
        soybean: "Soybean",
        maize: "Maize", makka: "Maize",
        sugarcane: "Sugarcane", ganna: "Sugarcane",
        groundnut: "Groundnut", mungfali: "Groundnut",
    };
    const lower = message.toLowerCase();
    for (const [key, value] of Object.entries(commodityMap)) {
        if (lower.includes(key)) return value;
    }
    return null;
};

// ─── Friendly fallback messages when all models fail ─────────────────────────
const FALLBACK_MESSAGES = [
    "I'm experiencing high demand right now. Please try again in a moment! 🌾",
    "Our AI assistant is temporarily busy. Please retry shortly. 🙏",
    "Service is temporarily unavailable due to high traffic. Try again in 30 seconds!",
];
let fallbackIndex = 0;

// ─── Main Chat Handler ────────────────────────────────────────────────────────

const handleChat = async (req, res) => {
    console.log("📨 Chat request received:", req.body.message);
    try {
        const { message, chatHistory = [], city: cityFromBody } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message is required" });
        }

        const { isWeather, isMarket } = detectIntent(message);
        let extraContext = "";

        // Fetch weather data if needed
        if (isWeather) {
            const city = cityFromBody || extractCity(message) || "Pune";
            try {
                const weatherData = await getWeatherByCity(city);
                extraContext += formatWeatherForGemini(weatherData) + "\n\n";
            } catch (err) {
                console.warn("Weather fetch failed:", err.message);
                extraContext += `Weather data temporarily unavailable for ${city}.\n\n`;
            }
        }

        // Fetch market prices if needed
        if (isMarket) {
            const commodity = extractCommodity(message);
            if (commodity) {
                try {
                    const prices = await getMarketPrices(commodity);
                    extraContext += formatMarketForGemini(prices, commodity) + "\n\n";
                } catch (err) {
                    console.warn("Market fetch failed:", err.message);
                    extraContext += `Market price data temporarily unavailable for ${commodity}.\n\n`;
                }
            }
        }

        // Build chat history with new user message
        const updatedHistory = [
            ...chatHistory,
            { role: "user", parts: [{ text: message }] },
        ];

        // Send to Gemini with fallback chain
        let reply;
        try {
            reply = await sendToGemini(updatedHistory, extraContext.trim() || null);
        } catch (geminiError) {
            // If ALL models fail — return a friendly message instead of 500 error
            console.error("All Gemini models failed:", geminiError.message);
            reply = FALLBACK_MESSAGES[fallbackIndex % FALLBACK_MESSAGES.length];
            fallbackIndex++;

            return res.json({
                role: "model",
                parts: [{ text: reply }],
                reply, // Fallback for old clients
                chatHistory: updatedHistory,
                meta: {
                    usedWeatherAPI: isWeather,
                    usedMarketAPI: isMarket,
                    geminiStatus: "unavailable",
                },
            });
        }

        // Add model reply to history
        const newHistory = [
            ...updatedHistory,
            { role: "model", parts: [{ text: reply }] },
        ];

        console.log("✅ Reply successfully generated");
        res.json({
            role: "model",
            parts: [{ text: reply }],
            reply, // Fallback for old clients
            chatHistory: newHistory,
            meta: {
                usedWeatherAPI: isWeather,
                usedMarketAPI: isMarket,
                geminiStatus: "ok",
            },
        });

    } catch (error) {
        console.error("Chat Controller Error:", error.message);
        res.status(500).json({ error: error.message || "Something went wrong" });
    }
};

module.exports = { handleChat };