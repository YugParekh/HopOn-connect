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
});

module.exports = mongoose.model("User", userSchema);