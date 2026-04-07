const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  eventId: String,
  hostId: String,
  userId: String,
  username: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  hostRating: { type: Number, min: 1, max: 5 },
  hostComment: String,
  eventTitle: String,
}, { timestamps: true });

reviewSchema.index({ eventId: 1, userId: 1 });

module.exports = mongoose.model("Review", reviewSchema);