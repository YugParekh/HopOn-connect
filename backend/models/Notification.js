const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    hostUserId: { type: String, required: true },
    requesterUserId: { type: String, required: true },
    eventId: { type: String, required: true },
    type: {
      type: String,
      enum: ["join_request"],
      default: "join_request",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    isRead: { type: Boolean, default: false },
    message: { type: String, default: "" },
  },
  { timestamps: true }
);

notificationSchema.index({ hostUserId: 1, status: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ eventId: 1, requesterUserId: 1, type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
