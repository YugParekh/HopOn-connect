const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const { createRateLimiter } = require("../middleware/rateLimit");
const { validateUserUpdateBody } = require("../middleware/requestGuards");

const profileLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyBuilder: (req) => `${req.ip}:${req.path}`,
  message: "Too many profile update requests. Please try again later.",
});

// create or get user
router.post("/sync", profileLimiter, verifyToken, async (req, res) => {
  try {
    const { uid, name, email, picture } = req.user;
    const { name: providedName } = req.body || {};

    let user = await User.findOne({ uid });

    if (!user) {
      user = await User.create({
        uid,
        name: providedName || name,
        email,
        photo: picture,
      });
    } else {
      if (providedName && user.name !== providedName) {
        user.name = providedName;
      }
      if (!user.photo && picture) {
        user.photo = picture;
      }
      await user.save();
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update user profile
router.put("/update", profileLimiter, verifyToken, validateUserUpdateBody, async (req, res) => {
  try {
    const { uid } = req.user;
    const {
      name,
      bio,
      city,
      location,
      interests,
      socialMedia,
      razorpayKeyId,
      razorpayKeySecret,
      photoDataUrl,
    } = req.body || {};

    let user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (photoDataUrl) {
      const upload = await cloudinary.uploader.upload(photoDataUrl, {
        folder: "hopon/profile-photos",
      });
      user.photo = upload.secure_url;
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (city !== undefined && location === undefined) user.location = city;
    if (Array.isArray(interests)) user.interests = interests;
    if (socialMedia && typeof socialMedia === "object") {
      user.socialMedia = {
        ...(user.socialMedia || {}),
        ...socialMedia,
      };
    }

    if (razorpayKeyId !== undefined) user.razorpayKeyId = razorpayKeyId;
    if (razorpayKeySecret !== undefined) user.razorpayKeySecret = razorpayKeySecret;
    user.isPaymentAccountSetup = !!(user.razorpayKeyId && user.razorpayKeySecret);

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/public/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email photo bio location interests socialMedia trustScore totalEventsAttended eventsCancelled averageHostRating averageAttendeeRating"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user trust score with details
router.get("/trust-score/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "trustScore totalEventsAttended eventsCancelled averageHostRating averageAttendeeRating"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const trustDetails = {
      score: user.trustScore || 50,
      level: calculateTrustLevel(user.trustScore || 50),
      eventsAttended: user.totalEventsAttended || 0,
      eventsCancelled: user.eventsCancelled || 0,
      hostRating: user.averageHostRating || 0,
      attendeeRating: user.averageAttendeeRating || 0,
    };

    res.json(trustDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate and update trust score (called after reviews or attendance updates)
router.post("/update-trust-score/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const Review = require("../models/Review");
    const Post = require("../models/Post");

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get all reviews by this user (as attendee/host)
    const reviews = await Review.find({ userId });

    // Get all reviews about this user (as host)
    const hostReviews = await Review.find({ hostId: userId });

    // Calculate metrics
    const averageHostRating = hostReviews.length
      ? hostReviews.reduce((sum, r) => sum + (r.hostRating || 0), 0) / hostReviews.length
      : 0;

    const averageAttendeeRating = reviews.length
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    // Get events created by user
    const hostedEvents = await Post.countDocuments({ userId });

    // Calculate trust score (0-100)
    let trustScore = 50; // Base score

    // Attendance bonus (up to 30 points)
    trustScore += Math.min(hostedEvents * 3, 30);

    // Host rating bonus (up to 20 points)
    if (averageHostRating > 0) {
      trustScore += (averageHostRating / 5) * 20;
    }

    // Attendee rating bonus (up to 15 points)
    if (averageAttendeeRating > 0) {
      trustScore += (averageAttendeeRating / 5) * 15;
    }

    // Cancellation penalty (up to -15 points)
    trustScore -= Math.min(user.eventsCancelled * 2, 15);

    // Cap between 0-100
    trustScore = Math.max(0, Math.min(100, trustScore));

    user.trustScore = trustScore;
    user.averageHostRating = averageHostRating;
    user.averageAttendeeRating = averageAttendeeRating;
    user.totalEventsAttended = hostedEvents;

    await user.save();

    res.json({
      success: true,
      trustScore,
      averageHostRating: averageHostRating.toFixed(2),
      averageAttendeeRating: averageAttendeeRating.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function
function calculateTrustLevel(score) {
  if (score >= 80) return "Verified";
  if (score >= 60) return "Trusted";
  if (score >= 40) return "Regular";
  if (score >= 20) return "New";
  return "Unverified";
}

module.exports = router;