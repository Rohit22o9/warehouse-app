// controllers/market.controller.js

const { getMarketPrices } = require("../services/market.service");

const getPrices = async (req, res) => {
    try {
        const { commodity, state } = req.query;
        if (!commodity)
            return res.status(400).json({ error: "Commodity is required" });

        const prices = await getMarketPrices(commodity, state || null);
        res.json({ success: true, data: prices });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getPrices };