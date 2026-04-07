const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// GET ALL MESSAGES
router.get("/", async (req, res) => {
  const { eventId } = req.query;
  const query = eventId ? { eventId } : {};
  const messages = await Message.find(query).sort({ timestamp: 1 }).limit(100);
  res.json(messages);
});

// POST MESSAGE
router.post("/", async (req, res) => {
  const { userId, username, message, eventId } = req.body;
  const newMessage = await Message.create({ userId, username, message, eventId: eventId || null });
  res.json(newMessage);
});

module.exports = router;