/**
 * market.js
 * All interactive logic for the NeuroNix Marketplace page.
 * Handles: Listings, Sell/Hold card, Quality Passport, Ticker, Negotiation Bot, Voice Search
 */

// ─────────────────────────────────────
// CONSTANTS & STATE
// ─────────────────────────────────────
let currentListings = [];
let sensorStatus = null;
let negotiationHistory = [];
let tickerInterval = null;
let recognition = null;

// ─────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    initLanguageSwitcher();
    initVoiceSearch();
    initNegotiationBot();
    initSearchAndFilter();

    // Load data in parallel
    const [listings, advisory, sensor, mandi] = await Promise.all([
        marketService.getListings(),
        marketService.getPriceAdvisory('Tomato'),
        marketService.getSensorStatus(),
        marketService.getMandiPrices()
    ]);

    currentListings = listings;
    sensorStatus = sensor;

    renderListings(currentListings, sensorStatus);
    renderPriceAdvisory(advisory);
    renderMandiTicker(mandi);
    renderSensorStatusBar(sensorStatus);

    // Auto-refresh ticker every 30s
    tickerInterval = setInterval(async () => {
        const fresh = await marketService.getMandiPrices();
        renderMandiTicker(fresh);
    }, 30000);
});

// ─────────────────────────────────────
// 1. CROP LISTINGS RENDERER
// ─────────────────────────────────────
function renderListings(listings, sensor) {
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    listings.forEach((crop, idx) => {
        const gradeA = crop.humidity < 70 && crop.gas < 50;
        const badgeHTML = gradeA
            ? `<span class="quality-badge grade-a"><i class="fas fa-shield-check"></i> Sensor-Verified: Grade A</span>`
            : `<span class="quality-badge grade-b"><i class="fas fa-leaf"></i> Quality: Standard</span>`;

        const card = document.createElement('div');
        card.className = 'listing-card';
        card.style.animationDelay = `${idx * 0.08}s`;
        card.innerHTML = `
            <div class="listing-header">
                <div class="listing-icon">${crop.icon}</div>
                <div class="listing-meta">
                    <h3 class="listing-name">${crop.name}</h3>
                    <p class="listing-farmer"><i class="fas fa-user-circle"></i> ${crop.farmer} · ${crop.location}</p>
                </div>
                <div class="listing-price">${crop.price}</div>
            </div>
            ${badgeHTML}
            <div class="listing-stats">
                <div class="lst-stat"><i class="fas fa-weight-hanging"></i><span>${crop.qty}</span></div>
                <div class="lst-stat"><i class="fas fa-map-marker-alt"></i><span>Zone ${crop.zone}</span></div>
                <div class="lst-stat"><i class="fas fa-clock"></i><span>${crop.daysLeft}d left</span></div>
            </div>
            <div class="sensor-readout">
                <span class="sensor-dot ${gradeA ? 'dot-green' : 'dot-yellow'}"></span>
                <span>Humidity: <strong>${crop.humidity}%</strong></span>
                <span style="margin-left:12px;">Gas: <strong>${crop.gas} ppm</strong></span>
            </div>
            <div class="listing-actions">
                <button class="btn-deal" onclick="openNegotiationBot('${crop.name}', '${crop.price}')">
                    <i class="fas fa-handshake"></i> Negotiate
                </button>
                <button class="btn-inspect" onclick="viewAdvisory('${crop.name}')">
                    <i class="fas fa-chart-line"></i> Price Forecast
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ─────────────────────────────────────
// 2. SELL vs HOLD DECISION CARD
// ─────────────────────────────────────
function renderPriceAdvisory(data) {
    const card = document.getElementById('advisoryCard');
    if (!card) return;

    const isSell = data.recommendation === 'SELL';
    const accent = isSell ? '#2E7D32' : '#FFB300';
    const bgAccent = isSell ? 'rgba(46,125,50,0.07)' : 'rgba(255,179,0,0.07)';
    const icon = isSell ? 'fa-circle-dollar-to-slot' : 'fa-hourglass-half';

    card.innerHTML = `
        <div class="advisory-top">
            <div class="advisory-icon" style="background:${bgAccent}; color:${accent};">
                <i class="fas ${icon}"></i>
            </div>
            <div>
                <div class="advisory-label">AI Bhav Advisory</div>
                <div class="advisory-crop">${data.crop} <span class="advisory-conf">· ${Math.round(data.confidence * 100)}% confidence</span></div>
            </div>
            <div class="advisory-badge" style="background:${accent};">${data.recommendation_label}</div>
        </div>
        <div class="advisory-prices">
            <div class="price-col">
                <div class="price-label">Today's Mandi Price</div>
                <div class="price-val">₹${data.current_mandi_price}<span>/kg</span></div>
            </div>
            <div class="price-arrow"><i class="fas fa-arrow-right"></i></div>
            <div class="price-col">
                <div class="price-label">Predicted (15-Day)</div>
                <div class="price-val" style="color:${accent};">₹${data.predicted_15day_price}<span>/kg</span></div>
            </div>
        </div>
        <div class="advisory-gain" style="background:${bgAccent}; border-left: 4px solid ${accent};">
            <i class="fas fa-coins" style="color:${accent};"></i>
            <span>Potential Profit Gain: <strong style="color:${accent};">+₹${data.potential_gain_per_kg}/kg</strong>
            — on 1 tonne = <strong style="color:${accent};">+₹${data.potential_gain_per_kg * 1000}</strong></span>
        </div>
        <p class="advisory-reasoning">${data.reasoning}</p>
        <div class="advisory-footer">
            <span><i class="fas fa-database"></i> ${data.source}</span>
            <button class="btn-advisory-refresh" onclick="refreshAdvisory()"><i class="fas fa-sync-alt"></i> Refresh</button>
        </div>
    `;

    // Animate price numbers counting up
    animateCount(card.querySelectorAll('.price-val'));
}

async function refreshAdvisory() {
    const crops = ['Tomato', 'Onion', 'Potato', 'Grapes', 'Chilli'];
    const randomCrop = crops[Math.floor(Math.random() * crops.length)];
    const card = document.getElementById('advisoryCard');
    card.innerHTML = `<div class="advisory-loading"><span class="spinner"></span> Fetching live Bhav data...</div>`;
    const data = await marketService.getPriceAdvisory(randomCrop);
    renderPriceAdvisory(data);
}

async function viewAdvisory(cropName) {
    const card = document.getElementById('advisoryCard');
    card.innerHTML = `<div class="advisory-loading"><span class="spinner"></span> Analysing ${cropName} market data...</div>`;
    const data = await marketService.getPriceAdvisory(cropName);
    renderPriceAdvisory(data);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function animateCount(elements) {
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        setTimeout(() => {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100);
    });
}

// ─────────────────────────────────────
// 3. SENSOR STATUS BAR
// ─────────────────────────────────────
function renderSensorStatusBar(sensor) {
    const bar = document.getElementById('sensorBar');
    if (!bar) return;

    const gradeA = sensor.grade === 'A';
    bar.innerHTML = `
        <span class="sensor-bar-dot ${gradeA ? 'dot-green' : 'dot-yellow'}"></span>
        <strong>${gradeA ? '✅ Sensor-Verified: Grade A Storage' : '⚠️ Standard Storage Conditions'}</strong>
        <span class="sensor-bar-divider">|</span>
        <span>🌡️ Temp: <strong>${sensor.temperature}°C</strong></span>
        <span>💧 Humidity: <strong>${sensor.humidity}%</strong></span>
        <span>💨 Gas: <strong>${sensor.gas_ppm} ppm</strong></span>
        <span class="sensor-bar-time">Updated: ${sensor.last_updated}</span>
    `;
    bar.className = `sensor-status-bar ${gradeA ? 'bar-green' : 'bar-yellow'}`;
}

// ─────────────────────────────────────
// 4. MANDI-SYNC LIVE TICKER
// ─────────────────────────────────────
function renderMandiTicker(items) {
    const track = document.getElementById('tickerTrack');
    if (!track) return;

    const html = items.map(item => {
        const changeNum = parseFloat(item.change);
        const arrow = changeNum >= 0 ? '▲' : '▼';
        const color = changeNum >= 0 ? '#4CAF50' : '#e53935';
        return `<span class="ticker-item">
            <span class="ticker-city">${item.city}</span>
            <span class="ticker-crop">${item.crop}</span>
            <span class="ticker-price">₹${item.price}/kg</span>
            <span class="ticker-change" style="color:${color};">${arrow}${Math.abs(changeNum)}%</span>
        </span><span class="ticker-sep">⟡</span>`;
    }).join('');

    // Duplicate for seamless scroll
    track.innerHTML = html + html;
}

// ─────────────────────────────────────
// 5. AI BHAV-TAAL NEGOTIATION BOT
// ─────────────────────────────────────
function initNegotiationBot() {
    const bubble = document.getElementById('negotiationBubble');
    const window_ = document.getElementById('negotiationWindow');
    const closeBtn = document.getElementById('negotiationClose');
    const sendBtn = document.getElementById('negotiationSend');
    const input = document.getElementById('negotiationInput');

    if (!bubble) return;

    bubble.addEventListener('click', () => {
        window_.style.display = window_.style.display === 'flex' ? 'none' : 'flex';
    });

    closeBtn?.addEventListener('click', () => { window_.style.display = 'none'; });

    sendBtn?.addEventListener('click', () => sendNegotiationMessage());
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') sendNegotiationMessage(); });

    // Welcome message
    appendNegotiationMessage('bot', '🙏 Namaste! I am the <strong>AI Bhav-Taal</strong> Negotiation Assistant.<br>Enter a crop name, your asking price, and a buyer\'s offer — I\'ll give you market-backed negotiation advice!');
}

async function sendNegotiationMessage() {
    const input = document.getElementById('negotiationInput');
    const msg = input.value.trim();
    if (!msg) return;

    appendNegotiationMessage('user', msg);
    input.value = '';
    showTypingIndicator();

    // Parse loosely for context
    const cropMatch = msg.match(/tomato|onion|potato|grapes|chilli|capsicum|garlic/i);
    const priceNumbers = msg.match(/\d+/g);

    const payload = {
        cropName: cropMatch ? cropMatch[0] : 'produce',
        farmerPrice: priceNumbers ? priceNumbers[0] : 30,
        buyerOffer: priceNumbers ? (priceNumbers[1] || priceNumbers[0] * 0.8) : 24,
        message: msg
    };

    const result = await marketService.negotiate(payload);
    hideTypingIndicator();
    appendNegotiationMessage('bot', result.response);
}

function appendNegotiationMessage(role, html) {
    const messages = document.getElementById('negotiationMessages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = `neg-message neg-${role}`;
    div.innerHTML = html;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function showTypingIndicator() {
    const messages = document.getElementById('negotiationMessages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = 'neg-message neg-bot neg-typing';
    div.id = 'typingIndicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
}

function openNegotiationBot(cropName, priceStr) {
    const window_ = document.getElementById('negotiationWindow');
    const input   = document.getElementById('negotiationInput');
    if (!window_) return;
    window_.style.display = 'flex';
    const price = priceStr.replace('₹', '').replace('/kg', '');
    const buyerOffer = Math.floor(parseFloat(price) * 0.78);
    if (input) input.value = `${cropName} - asking ₹${price}, buyer offers ₹${buyerOffer}`;
    appendNegotiationMessage('bot', `📦 I see you picked <strong>${cropName}</strong>. Let me analyse the current mandi trend...`);
    window_.scrollIntoView({ behavior: 'smooth' });
}

// ─────────────────────────────────────
// 6. LANGUAGE SWITCHER (uses existing i18n.js)
// ─────────────────────────────────────
function initLanguageSwitcher() {
    const selector = document.getElementById('marketLangSelect');
    if (!selector) return;

    // Sync with existing i18n system
    selector.addEventListener('change', (e) => {
        const lang = e.target.value;
        if (window.i18n && window.i18n.setLang) {
            window.i18n.setLang(lang);
        } else if (window.translations && window.applyTranslations) {
            window.applyTranslations(lang);
        } else {
            // Fallback: use custom market translations
            applyMarketTranslations(lang);
        }
        localStorage.setItem('preferred_lang', lang);
    });

    // Apply saved preference
    const saved = localStorage.getItem('preferred_lang') || 'en';
    selector.value = saved;
}

function applyMarketTranslations(lang) {
    const t = window.marketTranslations?.[lang];
    if (!t) return;
    document.querySelectorAll('[data-market-i18n]').forEach(el => {
        const key = el.getAttribute('data-market-i18n');
        if (t[key]) el.innerHTML = t[key];
    });
}

// ─────────────────────────────────────
// 7. VOICE SEARCH (Web Speech API)
// ─────────────────────────────────────
function initVoiceSearch() {
    const voiceBtn = document.getElementById('voiceSearchBtn');
    const searchInput = document.getElementById('cropSearch');
    if (!voiceBtn || !searchInput) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        voiceBtn.style.opacity = '0.4';
        voiceBtn.title = 'Voice search not supported in this browser';
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        searchInput.value = transcript;
        voiceBtn.classList.remove('voice-active');
        filterListings(transcript);
    };

    recognition.onerror = () => { voiceBtn.classList.remove('voice-active'); };
    recognition.onend   = () => { voiceBtn.classList.remove('voice-active'); };

    voiceBtn.addEventListener('click', () => {
        voiceBtn.classList.add('voice-active');
        const lang = document.getElementById('marketLangSelect')?.value || 'en';
        recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
        recognition.start();
    });
}

// ─────────────────────────────────────
// 8. SEARCH & FILTER
// ─────────────────────────────────────
function initSearchAndFilter() {
    const searchInput = document.getElementById('cropSearch');
    const filterSelect = document.getElementById('locationFilter');
    const sortSelect   = document.getElementById('sortSelect');

    searchInput?.addEventListener('input', () => applyFilters());
    filterSelect?.addEventListener('change', () => applyFilters());
    sortSelect?.addEventListener('change', () => applyFilters());
}

function filterListings(query = '') {
    const searchInput = document.getElementById('cropSearch');
    if (searchInput && query) searchInput.value = query;
    applyFilters();
}

function applyFilters() {
    const query    = document.getElementById('cropSearch')?.value.toLowerCase() || '';
    const location = document.getElementById('locationFilter')?.value || 'all';
    const sort     = document.getElementById('sortSelect')?.value || 'default';

    let filtered = currentListings.filter(c => {
        const matchQuery    = c.name.toLowerCase().includes(query) || c.farmer.toLowerCase().includes(query);
        const matchLocation = location === 'all' || c.location === location;
        return matchQuery && matchLocation;
    });

    if (sort === 'price-high') filtered.sort((a, b) => parseFloat(b.price.replace(/[₹\/kg]/g, '')) - parseFloat(a.price.replace(/[₹\/kg]/g, '')));
    if (sort === 'price-low')  filtered.sort((a, b) => parseFloat(a.price.replace(/[₹\/kg]/g, '')) - parseFloat(b.price.replace(/[₹\/kg]/g, '')));
    if (sort === 'days-left')  filtered.sort((a, b) => a.daysLeft - b.daysLeft);
    if (sort === 'grade-a')    filtered.sort((a, b) => (a.humidity < 70 && a.gas < 50 ? -1 : 1));

    renderListings(filtered, sensorStatus);

    const countEl = document.getElementById('listingsCount');
    if (countEl) countEl.textContent = `${filtered.length} listing${filtered.length !== 1 ? 's' : ''} found`;
}

// Market-specific i18n translations
window.marketTranslations = {
    en: {
        'market-title': 'NeuroNix Marketplace',
        'market-subtitle': 'AI-Verified Crop Listings from Smart Warehouses',
        'market-search-placeholder': 'Search crops, farmers...',
        'market-advisory-title': 'AI Sell vs Hold Advisor',
        'market-listings-title': 'Live Crop Listings',
        'market-bot-title': 'AI Negotiation Assistant',
        'market-bot-placeholder': 'e.g. Tomato asking ₹30, buyer offers ₹22...',
        'market-ticker-label': 'LIVE MANDI PRICES',
    },
    hi: {
        'market-title': 'NeuroNix बाज़ार',
        'market-subtitle': 'स्मार्ट गोदामों से एआई-सत्यापित फसल सूचियाँ',
        'market-search-placeholder': 'फसल, किसान खोजें...',
        'market-advisory-title': 'एआई बेचें बनाम रखें सलाहकार',
        'market-listings-title': 'लाइव फसल सूचियाँ',
        'market-bot-title': 'एआई वार्ता सहायक',
        'market-bot-placeholder': 'उदा. टमाटर ₹30 मांग रहे हैं, खरीदार ₹22 दे रहा है...',
        'market-ticker-label': 'लाइव मंडी भाव',
    },
    mr: {
        'market-title': 'NeuroNix बाजारपेठ',
        'market-subtitle': 'स्मार्ट गोदामांमधून AI-सत्यापित पीक याद्या',
        'market-search-placeholder': 'पीक, शेतकरी शोधा...',
        'market-advisory-title': 'AI विका किंवा थांबा सल्लागार',
        'market-listings-title': 'थेट पीक याद्या',
        'market-bot-title': 'AI वाटाघाटी सहाय्यक',
        'market-bot-placeholder': 'उदा. टोमॅटो ₹30 मागत आहेत, खरेदीदार ₹22 देत आहे...',
        'market-ticker-label': 'थेट मंडई भाव',
    }
};
