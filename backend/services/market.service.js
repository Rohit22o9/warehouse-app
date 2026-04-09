// services/market.service.js

const axios = require("axios");

const DATA_GOV_BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

/**
 * Fetch mandi market prices for a commodity
 * @param {string} commodity - e.g., "Wheat", "Tomato", "Rice"
 * @param {string|null} state - Optional state filter e.g., "Maharashtra"
 * @returns {Array} - Array of market price records
 */
const getMarketPrices = async (commodity, state = null) => {
    try {
        const apiKey = process.env.DATA_GOV_API_KEY;
        if (!apiKey) throw new Error("DATA_GOV_API_KEY is missing in .env");

        const params = {
            "api-key": apiKey,
            format: "json",
            limit: 10,
            "filters[commodity]": commodity,
        };

        if (state) {
            params["filters[state]"] = state;
        }

        const response = await axios.get(DATA_GOV_BASE, { params });

        const records = response.data?.records || [];

        if (records.length === 0) {
            throw new Error(`No market data found for "${commodity}"`);
        }

        return records.map((r) => ({
            state: r.state,
            district: r.district,
            market: r.market,
            commodity: r.commodity,
            variety: r.variety,
            arrivalDate: r.arrival_date,
            minPrice: r.min_price,
            maxPrice: r.max_price,
            modalPrice: r.modal_price, // most common price
        }));
    } catch (error) {
        console.error(
            "Market API Error:",
            error.response?.data || error.message
        );
        throw new Error(`Could not fetch market prices for "${commodity}"`);
    }
};

/**
 * Format market data as a readable string for Gemini context injection
 */
const formatMarketForGemini = (prices, commodity) => {
    if (!prices || prices.length === 0)
        return `No market prices found for ${commodity}.`;

    const lines = prices
        .slice(0, 5)
        .map(
            (p) =>
                `- ${p.market}, ${p.district} (${p.state}): Min ₹${p.minPrice} | Max ₹${p.maxPrice} | Modal ₹${p.modalPrice} per quintal [${p.arrivalDate}]`
        )
        .join("\n");

    return `Market Prices for ${commodity}:\n${lines}`;
};

module.exports = { getMarketPrices, formatMarketForGemini };