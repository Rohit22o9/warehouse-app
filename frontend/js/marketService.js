/**
 * marketService.js
 * Centralized API service layer for the NeuroNix Marketplace Module.
 * All market-related API calls are routed through here for consistency.
 */

const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : '';

const marketService = {

    /**
     * Fetch all crop listings with simulated sensor/quality data.
     * @returns {Promise<Array>}
     */
    async getListings() {
        try {
            const res = await fetch(`${BASE_URL}/api/market/listings`);
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.warn('[marketService] getListings fallback:', err.message);
            return this._fallbackListings();
        }
    },

    /**
     * Fetch the AI Sell vs Hold price advisory card data.
     * @param {string} cropName - Crop to get advice for
     * @returns {Promise<Object>}
     */
    async getPriceAdvisory(cropName = 'Tomato') {
        try {
            const res = await fetch(`${BASE_URL}/api/market/price-advisory?crop=${encodeURIComponent(cropName)}`);
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.warn('[marketService] getPriceAdvisory fallback:', err.message);
            return this._fallbackPriceAdvisory(cropName);
        }
    },

    /**
     * Fetch simulated live Mandi prices for the ticker.
     * @returns {Promise<Array>}
     */
    async getMandiPrices() {
        try {
            const res = await fetch(`${BASE_URL}/api/market/mandi-prices`);
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.warn('[marketService] getMandiPrices fallback:', err.message);
            return this._fallbackMandiPrices();
        }
    },

    /**
     * Fetch latest sensor status to compute the Quality Passport badge.
     * @returns {Promise<Object>}
     */
    async getSensorStatus() {
        try {
            const res = await fetch(`${BASE_URL}/api/market/sensor-status`);
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.warn('[marketService] getSensorStatus fallback:', err.message);
            return this._fallbackSensorStatus();
        }
    },

    /**
     * Send a negotiation message to the AI Bhav-Taal bot.
     * @param {Object} payload - { farmerPrice, buyerOffer, cropName, message }
     * @returns {Promise<Object>}
     */
    async negotiate(payload) {
        try {
            const res = await fetch(`${BASE_URL}/api/market/negotiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.json();
        } catch (err) {
            console.warn('[marketService] negotiate fallback:', err.message);
            return this._fallbackNegotiate(payload);
        }
    },

    // ─────────────────────────────────────────────
    // OFFLINE FALLBACKS (used when backend is down)
    // ─────────────────────────────────────────────

    _fallbackListings() {
        const crops = [
            { id: 'LST-001', name: 'Tomato',   icon: '🍅', qty: '1,200 kg', price: '₹28/kg',  zone: 'A1', humidity: 62, gas: 38, daysLeft: 12, farmer: 'Sunita Devi',   location: 'Nashik' },
            { id: 'LST-002', name: 'Onion',    icon: '🧅', qty: '800 kg',   price: '₹18/kg',  zone: 'B2', humidity: 68, gas: 45, daysLeft: 25, farmer: 'Rekha Patil',   location: 'Pune'   },
            { id: 'LST-003', name: 'Potato',   icon: '🥔', qty: '2,000 kg', price: '₹15/kg',  zone: 'C1', humidity: 71, gas: 55, daysLeft: 30, farmer: 'Anita Rao',     location: 'Mumbai' },
            { id: 'LST-004', name: 'Grapes',   icon: '🍇', qty: '500 kg',   price: '₹95/kg',  zone: 'A3', humidity: 60, gas: 28, daysLeft: 8,  farmer: 'Kavita Sharma', location: 'Nashik' },
            { id: 'LST-005', name: 'Chilli',   icon: '🌶️', qty: '320 kg',   price: '₹62/kg',  zone: 'D2', humidity: 55, gas: 32, daysLeft: 20, farmer: 'Meena Joshi',   location: 'Pune'   },
            { id: 'LST-006', name: 'Capsicum', icon: '🫑', qty: '410 kg',   price: '₹45/kg',  zone: 'B4', humidity: 73, gas: 60, daysLeft: 6,  farmer: 'Priya Nair',    location: 'Mumbai' },
        ];
        return crops;
    },

    _fallbackPriceAdvisory(cropName) {
        const r = Math.random();
        const currentPrice = Math.floor(25 + r * 30);
        const predictedPrice = Math.floor(currentPrice * (1.1 + Math.random() * 0.3));
        const gain = predictedPrice - currentPrice;
        const recommendation = gain > 8 ? 'HOLD' : 'SELL';
        return {
            crop: cropName,
            current_mandi_price: currentPrice,
            predicted_15day_price: predictedPrice,
            potential_gain_per_kg: gain,
            recommendation,
            recommendation_label: recommendation === 'HOLD' ? 'Wait 1 Week' : 'Sell Now',
            reasoning: recommendation === 'HOLD'
                ? `AI detects rising demand in Nashik & Pune mandis. Holding for 7–10 days could yield ₹${gain}/kg extra.`
                : `Current prices are near peak. Delayed dispatch risks ₹${Math.abs(gain)}/kg loss due to forecasted supply surplus.`,
            confidence: (0.82 + Math.random() * 0.14).toFixed(2),
            source: 'Simulation (Fallback)'
        };
    },

    _fallbackMandiPrices() {
        const items = ['Tomato', 'Onion', 'Potato', 'Grapes', 'Chilli', 'Capsicum', 'Garlic', 'Cabbage'];
        const cities = ['Pune', 'Nashik', 'Mumbai'];
        const result = [];
        cities.forEach(city => {
            items.forEach(item => {
                result.push({
                    city,
                    crop: item,
                    price: Math.floor(12 + Math.random() * 100),
                    change: ((Math.random() - 0.4) * 10).toFixed(1),
                    unit: 'per kg'
                });
            });
        });
        return result;
    },

    _fallbackSensorStatus() {
        const humidity = Math.floor(50 + Math.random() * 40);
        const gas = Math.floor(20 + Math.random() * 70);
        return {
            humidity,
            gas_ppm: gas,
            temperature: (18 + Math.random() * 8).toFixed(1),
            grade: (humidity < 70 && gas < 50) ? 'A' : 'B',
            badge: (humidity < 70 && gas < 50) ? 'Sensor-Verified: Grade A' : 'Quality: Standard',
            status: (humidity < 70 && gas < 50) ? 'optimal' : 'moderate',
            last_updated: new Date().toLocaleTimeString()
        };
    },

    _fallbackNegotiate({ farmerPrice, buyerOffer, cropName, message }) {
        const crop = cropName || 'produce';
        const farmer = parseFloat(farmerPrice) || 30;
        const buyer = parseFloat(buyerOffer) || 22;
        const mid = ((farmer + buyer) / 2).toFixed(0);

        const responses = [
            `📊 Based on today's ${crop} prices across Nashik, Pune, and Mumbai mandis, a fair settlement is **₹${mid}/kg**. The 7-day demand trend shows a +8% uptick — the farmer's ask of ₹${farmer} is reasonable.`,
            `🤖 AI Bhav-Taal Analysis: Current mandi average for ${crop} is ₹${mid}/kg. I recommend a deal at **₹${mid}/kg**, with quality-passport certification included, which the buyer can verify via the sensor data.`,
            `💡 Market intelligence: The buyer's offer of ₹${buyer}/kg is 12% below the rolling 7-day average. Consider meeting at **₹${mid}/kg** — this protects the farmer's margin while offering the buyer a 5% discount vs. spot market.`
        ];

        return {
            response: responses[Math.floor(Math.random() * responses.length)],
            suggested_price: parseFloat(mid),
            market_data: {
                avg_7day: parseFloat(mid) + 2,
                trend: '+5.8%',
                mandi: 'Nashik APMC'
            }
        };
    }
};

// Make globally available
window.marketService = marketService;
