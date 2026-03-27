/**
 * AgriFresh NeuroNix AI Chatbot
 * Tries the backend /api/chat first.
 * If the backend is unreachable, falls back to a smart local response engine
 * so the chatbot never shows a raw "I'm offline" error.
 */

(function () {
    // ─── Local Fallback Response Engine ──────────────────────────────────────
    const fallbackEngine = (msg) => {
        const m = msg.toLowerCase();

        if (m.match(/\b(hi|hello|hey|namaste|who are you)\b/)) {
            return "Namaste! 🙏 I'm the NeuroNix AI Assistant. I can help you with temperature status, inventory levels, spoilage risks, and more. (Running in demo mode — backend offline)";
        }

        if (m.match(/\b(temp|temperature|hot|cold|zone|sensor)\b/)) {
            const zones = [
                { name: "A1", temp: (13 + Math.random() * 3).toFixed(1) },
                { name: "B2", temp: (14 + Math.random() * 4).toFixed(1) },
                { name: "C4", temp: (16 + Math.random() * 5).toFixed(1) },
            ];
            const alerts = zones.filter(z => parseFloat(z.temp) > 17);
            let resp = "📡 Live Demo Sensor Data:\n" + zones.map(z => `• Zone ${z.name}: ${z.temp}°C`).join("\n");
            if (alerts.length > 0) {
                resp += `\n\n⚠️ ALERT: Zone ${alerts.map(a => a.name).join(", ")} is above safe limit (17°C)! Consider increasing cooling.`;
            } else {
                resp += "\n\n✅ All zones are within safe temperature range.";
            }
            return resp;
        }

        if (m.match(/\b(stock|inventory|how many|quantity|produce|stored)\b/)) {
            return "📦 Current Warehouse Stock (Demo):\n• Tomato — 2,800 kg (38%)\n• Onion — 1,600 kg (22%)\n• Potato — 1,100 kg (15%)\n• Grapes — 730 kg (10%)\n• Available Space — 770 kg capacity\n\nTotal utilization: 84%";
        }

        if (m.match(/\b(spoil|risk|expir|bad|rot|dispatch)\b/)) {
            return "🔬 AI Spoilage Analysis (Demo):\n• Tomato Batch #TOM-291 — HIGH RISK (3 days left) — Dispatch immediately!\n• Onion Batch #ONI-088 — MODERATE (7 days) — Monitor closely\n• Potato Batch #POT-145 — SAFE (15 days)\n\nRecommendation: Prioritize Tomato dispatch to local market within 24 hours.";
        }

        if (m.match(/\b(alert|warning|critical|problem|issue)\b/)) {
            return "🚨 Active Alerts (Demo):\n• Zone C4: Temperature at 19.2°C — above safe limit!\n• Tomato Batch #TOM-291: 14% spoilage risk increase overnight\n• Humidity in Zone B: 72% — monitor closely\n\nAll other zones are operating normally.";
        }

        if (m.match(/\b(humidity|moisture|water)\b/)) {
            return "💧 Humidity Report (Demo):\n• Zone A1: 64% — Optimal\n• Zone B2: 68% — Acceptable\n• Zone C4: 72% — Above recommended threshold\n\nRecommended: Activate dehumidifier in Zone C4 to bring levels below 65%.";
        }

        if (m.match(/\b(profit|income|money|earn|revenue|roi)\b/)) {
            return "💰 Financial Overview (Demo):\n• AI-prevented losses this month: ₹2.98 Lakh\n• Avg. market timing gain: +18% per batch\n• Projected seasonal ROI: ₹4.2 Lakh\n\nHint: Dispatching Tomatoes this week during the projected price peak could add ₹120/qtl!";
        }

        if (m.match(/\b(help|what can you do|features|commands)\b/)) {
            return "🤖 I can help you with:\n• 🌡️ Temperature — current zone readings\n• 📦 Inventory — stock levels & produce types\n• ⚠️ Spoilage Risks — AI batch predictions\n• 🚨 Alerts — active warnings\n• 💧 Humidity — moisture levels\n• 💰 Profits — revenue & ROI insights\n\nJust ask me in plain language!";
        }

        return "🤔 I'm not sure about that. You can ask me about:\n• Temperature or sensor status\n• Inventory / stock levels\n• Spoilage risks\n• Active alerts\n• Humidity or environment\n• Profit / revenue insights\n\nType 'help' to see all options.";
    };

    // ─── Backend URL ──────────────────────────────────────────────────────────
    // When served via the Node server, '/api/chat' resolves to port 5000.
    // When opened as a plain file, fetch fails → fallback kicks in.
    const API_URL = '/api/chat';

    // ─── Init: wire up the chatbot UI ─────────────────────────────────────────
    function init() {
        const bubble = document.getElementById('chatbot-bubble');
        const windowChat = document.getElementById('chatbot-window');
        const closeChat = document.getElementById('close-chat');
        const sendBtn = document.getElementById('send-chat');
        const input = document.getElementById('chat-input');
        const messagesContainer = document.getElementById('chat-messages');

        if (!bubble || !windowChat || !messagesContainer) return;

        // Toggle open/close
        bubble.addEventListener('click', () => {
            windowChat.style.display = windowChat.style.display === 'flex' ? 'none' : 'flex';
            if (windowChat.style.display === 'flex' && input) input.focus();
        });

        if (closeChat) {
            closeChat.addEventListener('click', () => {
                windowChat.style.display = 'none';
            });
        }

        // "Get Help" button on dashboard sidebar
        const getHelpBtn = document.getElementById('getHelpBtn');
        if (getHelpBtn) {
            getHelpBtn.addEventListener('click', () => {
                windowChat.style.display = 'flex';
                if (input) input.focus();
                windowChat.style.borderColor = 'var(--primary)';
                windowChat.style.boxShadow = '0 0 20px rgba(46,125,50,0.3)';
                setTimeout(() => {
                    windowChat.style.borderColor = '';
                    windowChat.style.boxShadow = '';
                }, 1000);
            });
        }

        // Add message bubble
        const addMessage = (text, isUser = false) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
            msgDiv.innerText = text;
            messagesContainer.appendChild(msgDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        // Typing indicator
        const showTyping = () => {
            const typing = document.createElement('div');
            typing.className = 'message bot-message';
            typing.id = 'typing-indicator';
            typing.innerHTML = '<span style="opacity:0.6">● ● ●</span>';
            messagesContainer.appendChild(typing);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };
        const hideTyping = () => {
            const t = document.getElementById('typing-indicator');
            if (t) t.remove();
        };

        // Main chat handler
        const handleChat = async () => {
            const text = input.value.trim();
            if (!text) return;

            addMessage(text, true);
            input.value = '';
            showTyping();

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await response.json();
                hideTyping();
                addMessage(data.response || "I'm having trouble understanding. Please try again.");
            } catch (err) {
                // Backend unreachable — use local fallback silently
                hideTyping();
                // Small simulated delay for realism
                setTimeout(() => {
                    addMessage(fallbackEngine(text));
                }, 400);
            }
        };

        if (sendBtn) sendBtn.addEventListener('click', handleChat);
        if (input) input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
