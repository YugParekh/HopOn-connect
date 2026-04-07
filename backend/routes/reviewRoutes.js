const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Post = require("../models/Post");
const { hasEventEnded } = require("../utils/eventTime");

// GET REVIEWS FOR EVENT
router.get("/event/:eventId", async (req, res) => {
  try {
    const reviews = await Review.find({ eventId: req.params.eventId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET HOST RATING SUMMARY
router.get("/host/:hostId", async (req, res) => {
  try {
    const hostId = req.params.hostId;
    const hostReviews = await Review.find({
      hostId,
      hostRating: { $gte: 1, $lte: 5 },
    }).sort({ createdAt: -1 });

    const totalHostRatings = hostReviews.length;
    const averageHostRating = totalHostRatings
      ? hostReviews.reduce((sum, review) => sum + (review.hostRating || 0), 0) / totalHostRatings
      : 0;

    res.json({
      hostId,
      totalHostRatings,
      averageHostRating,
      reviews: hostReviews,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET REVIEWS BY USER
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    const reviews = await Review.find({ userId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST REVIEW
router.post("/", async (req, res) => {
  try {
    const {
      eventId,
      userId,
      username,
      rating,
      comment,
      hostRating,
      hostComment,
      eventTitle,
    } = req.body;

    if (!eventId || !userId || !username) {
      return res.status(400).json({ error: "eventId, userId and username are required" });
    }

    if (!Number.isFinite(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Event rating must be between 1 and 5" });
    }

    if (!Number.isFinite(Number(hostRating)) || Number(hostRating) < 1 || Number(hostRating) > 5) {
      return res.status(400).json({ error: "Host rating must be between 1 and 5" });
    }

    const event = await Post.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!hasEventEnded(event)) {
      return res.status(400).json({ error: "Reviews are allowed only after the event has ended" });
    }

    if (!event.attendees?.includes(userId)) {
      return res.status(403).json({ error: "Only attendees can review this event" });
    }

    const existingReview = await Review.findOne({ eventId, userId });
    if (existingReview) {
      return res.status(409).json({ error: "You have already reviewed this event" });
    }

    const review = await Review.create({
      eventId,
      hostId: event.userId,
      userId,
      username,
      rating: Number(rating),
      comment: comment || "",
      hostRating: Number(hostRating),
      hostComment: hostComment || "",
      eventTitle: eventTitle || event.title || "",
    });

    res.json(review);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "You have already reviewed this event" });
    }
    res.status(500).json({ error: error.message });
  }
});

// UPDATE REVIEW
router.put("/:id", async (req, res) => {
  try {
    const updated = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE REVIEW
router.delete("/:id", async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;