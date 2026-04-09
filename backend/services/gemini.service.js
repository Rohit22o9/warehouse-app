// services/gemini.service.js

const axios = require("axios");
const { getGeminiURL, GEMINI_MODELS } = require("../config/gemini");
const { AGRIFRESH_SYSTEM_PROMPT } = require("../prompts/agrifresh.prompt");

// Track which model is currently working
let currentModelIndex = 0;

/**
 * Send a message to Gemini with automatic fallback across models
 * Retries up to 2 times per model, then moves to next model
 */
const sendToGemini = async (chatHistory, extraContext = null) => {
    let lastError = null;

    for (let m = 0; m < GEMINI_MODELS.length; m++) {
        const modelIndex = (currentModelIndex + m) % GEMINI_MODELS.length;
        const modelName = GEMINI_MODELS[modelIndex];

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const url = getGeminiURL(modelName);
                console.log(`🤖 Model: ${modelName} | Attempt: ${attempt}`);

                let contents = [...chatHistory];
                if (extraContext) {
                    const lastIndex = contents.length - 1;
                    const lastText = contents[lastIndex].parts[0].text;
                    contents[lastIndex] = {
                        role: "user",
                        parts: [{ text: `${lastText}\n\n[Real-time Context]:\n${extraContext}` }],
                    };
                }

                const response = await axios.post(url, {
                    system_instruction: { parts: [{ text: AGRIFRESH_SYSTEM_PROMPT }] },
                    contents,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
                }, { 
                    headers: { "Content-Type": "application/json" },
                    timeout: 20000 
                });

                const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!reply) throw new Error("Empty AI response");

                currentModelIndex = modelIndex;
                return reply;

            } catch (error) {
                const errMsg = error.response?.data?.error?.message || error.message;
                console.error(`❌ ${modelName} fail: ${errMsg}`);
                lastError = errMsg;

                if (error.response?.status === 401 || error.response?.status === 403) {
                    throw new Error("Invalid Gemini API Key");
                }

                if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
    throw new Error(lastError || "All models failed");
};

module.exports = { sendToGemini };