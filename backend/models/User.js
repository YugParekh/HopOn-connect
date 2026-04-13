const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: String, // firebase uid
  name: String,
  email: String,
  photo: String,
  bio: String,
  location: String,
  interests: { type: [String], default: [] },
  socialMedia: {
    instagram: String,
    twitter: String,
    facebook: String,
    website: String,
  },
  
  // Razorpay Payment Account
  razorpayKeyId: String,
  razorpayKeySecret: String,
  isPaymentAccountSetup: { type: Boolean, default: false },

  // Trust Score System
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  totalEventsAttended: { type: Number, default: 0 },
  eventsCancelled: { type: Number, default: 0 },
  averageHostRating: { type: Number, default: 0 },
  averageAttendeeRating: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", userSchema);