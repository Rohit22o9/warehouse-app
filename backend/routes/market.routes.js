// routes/market.routes.js

const express = require("express");
const router = express.Router();
const { getPrices } = require("../controllers/market.controller");

// GET /api/market?commodity=Wheat&state=Maharashtra
router.get("/", getPrices);

module.exports = router;