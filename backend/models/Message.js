const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: String,
  username: String,
  message: String,
  eventId: String,
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);