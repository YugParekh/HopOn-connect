const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId: String,

  title: String,
  description: String,
  image: String,

  location: String,
  lat: Number,
  lng: Number,

  date: String,
  time: String,
  price: String,
  priceType: { type: String, enum: ['free', 'paid'], default: 'free' },
  category: String,
  capacity: Number,
  district: String,

  attendees: { type: [String], default: [] },
  requests: { type: [String], default: [] },
  joinRequests: {
    type: [
      {
        userId: String,
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        isReadByHost: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  
  // Payment tracking
  payments: [
    {
      userId: String,
      amount: Number,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }
  ],

}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);