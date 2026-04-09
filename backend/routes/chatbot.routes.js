// routes/chatbot.routes.js

const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/chatbot.controller");

// POST /api/chat
// Body: { message: string, chatHistory: array, city?: string }
router.post("/", handleChat);

module.exports = router;