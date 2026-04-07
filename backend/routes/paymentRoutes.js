const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { createRateLimiter } = require("../middleware/rateLimit");
const { hasEventEnded } = require("../utils/eventTime");
const {
  validateCreateOrderBody,
  validateVerifyPaymentBody,
} = require("../middleware/requestGuards");

const router = express.Router();

const paymentLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 50,
  keyBuilder: (req) => `${req.ip}:${req.path}`,
  message: "Too many payment requests. Please try again later.",
});

const webhookLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 240,
  keyBuilder: (req) => `${req.ip}:razorpay-webhook`,
  message: "Webhook traffic limit reached.",
});

const toReceiptToken = (value, max = 10) =>
  String(value || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-max);

const buildReceipt = (eventId, userId) => {
  const eventToken = toReceiptToken(eventId, 10);
  const userToken = toReceiptToken(userId, 10);
  const timeToken = Date.now().toString(36).slice(-8);

  return `ev${eventToken}u${userToken}t${timeToken}`.slice(0, 40);
};

const getHostForEventOwner = async (eventOwnerIdentity) => {
  return (
    (await User.findOne({ _id: eventOwnerIdentity })) ||
    (await User.findOne({ uid: eventOwnerIdentity }))
  );
};

const finalizePayment = async ({
  event,
  userId,
  amount,
  razorpayOrderId,
  razorpayPaymentId,
}) => {
  const existingPayment = event.payments.find(
    (payment) => payment.razorpayPaymentId === razorpayPaymentId
  );

  if (!existingPayment) {
    event.payments.push({
      userId,
      amount,
      razorpayOrderId,
      razorpayPaymentId,
      status: "completed",
    });
  }

  if (!event.attendees.includes(userId)) {
    event.attendees.push(userId);
  }

  event.requests = event.requests.filter((requestUserId) => requestUserId !== userId);
  event.joinRequests = event.joinRequests.map((request) => {
    if (request.userId === userId && request.status === "pending") {
      return {
        ...request.toObject(),
        status: "approved",
        isReadByHost: true,
        updatedAt: new Date(),
      };
    }
    return request;
  });

  await event.save();

  await Notification.findOneAndUpdate(
    {
      hostUserId: event.userId,
      requesterUserId: userId,
      eventId: event._id.toString(),
      type: "join_request",
      status: "pending",
    },
    {
      status: "approved",
      isRead: true,
      message: "Join request auto-approved after successful payment",
    }
  );
};

// 💳 CREATE RAZORPAY ORDER (for paid events)
router.post("/create-order", paymentLimiter, validateCreateOrderBody, async (req, res) => {
  try {
    const { eventId, userId, amount } = req.body;

    // Get event to fetch host details
    const event = await Post.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (hasEventEnded(event)) {
      return res.status(400).json({ error: "This event has already ended. Joining is closed." });
    }

    // Get host's Razorpay credentials
    const host = await getHostForEventOwner(event.userId);
    if (!host || !host.razorpayKeyId || !host.razorpayKeySecret) {
      return res.status(400).json({ error: "Host has not setup payment account" });
    }

    // Initialize Razorpay with host's credentials
    const razorpay = new Razorpay({
      key_id: host.razorpayKeyId,
      key_secret: host.razorpayKeySecret,
    });

    // Create order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: buildReceipt(eventId, userId),
      notes: {
        eventId: eventId,
        userId: userId,
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      keyId: host.razorpayKeyId,
      amount: amount,
      eventId: eventId,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ VERIFY PAYMENT & STORE TRANSACTION
router.post("/verify-payment", paymentLimiter, validateVerifyPaymentBody, async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      eventId,
      userId,
      amount,
    } = req.body;

    // Get event to fetch host's secret
    const event = await Post.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (hasEventEnded(event)) {
      return res.status(400).json({ error: "This event has already ended. Joining is closed." });
    }

    // Get host's Razorpay key secret
    const host = await getHostForEventOwner(event.userId);
    if (!host || !host.razorpayKeySecret) {
      return res.status(400).json({ error: "Host account not configured" });
    }

    // Verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", host.razorpayKeySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    await finalizePayment({
      event,
      userId,
      amount,
      razorpayOrderId,
      razorpayPaymentId,
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/webhook", webhookLimiter, async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!signature) {
      return res.status(400).json({ error: "Missing webhook signature" });
    }

    const bodyBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body || {}));

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(bodyBuffer)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const payload = JSON.parse(bodyBuffer.toString("utf8"));
    const eventType = payload.event;

    if (eventType === "payment.captured") {
      const payment = payload.payload?.payment?.entity;
      const notes = payment?.notes || {};

      const eventId = notes.eventId;
      const userId = notes.userId;
      const amount = payment?.amount ? payment.amount / 100 : 0;
      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;

      if (eventId && userId && razorpayOrderId && razorpayPaymentId && amount > 0) {
        const post = await Post.findById(eventId);
        if (post && !hasEventEnded(post)) {
          await finalizePayment({
            event: post,
            userId,
            amount,
            razorpayOrderId,
            razorpayPaymentId,
          });
        }
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Webhook handling error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 🔑 UPDATE HOST'S RAZORPAY CREDENTIALS
router.post("/update-razorpay-keys", paymentLimiter, async (req, res) => {
  try {
    const { userId, razorpayKeyId, razorpayKeySecret } = req.body;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(400).json({ error: "Both keys are required" });
    }

    // Update user with Razorpay credentials
    const user = await User.findOneAndUpdate(
      { $or: [{ uid: userId }, { _id: userId }] },
      {
        razorpayKeyId: razorpayKeyId,
        razorpayKeySecret: razorpayKeySecret,
        isPaymentAccountSetup: true,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Razorpay account linked successfully",
      user: user,
    });
  } catch (error) {
    console.error("Razorpay update error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📊 GET PAYMENT HISTORY FOR HOST
router.get("/host-payments/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all events by this host
    const events = await Post.find({ userId: userId });
    
    let totalPayments = [];
    let totalEarnings = 0;

    // Collect all payments from all events
    events.forEach((event) => {
      if (event.payments && event.payments.length > 0) {
        event.payments.forEach((payment) => {
          if (payment.status === "completed") {
            totalPayments.push({
              ...payment,
              eventTitle: event.title,
              eventId: event._id,
            });
            totalEarnings += payment.amount;
          }
        });
      }
    });

    res.json({
      success: true,
      totalEarnings: totalEarnings,
      totalTransactions: totalPayments.length,
      payments: totalPayments,
    });
  } catch (error) {
    console.error("Fetch payments error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
