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
      "name email photo bio location interests socialMedia"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;