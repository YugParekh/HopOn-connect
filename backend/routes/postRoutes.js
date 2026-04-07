const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Post = require("../models/Post");
const Message = require("../models/Message");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { createRateLimiter } = require("../middleware/rateLimit");
const { validateJoinActionBody } = require("../middleware/requestGuards");
const { hasEventEnded } = require("../utils/eventTime");

const joinActionLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  keyBuilder: (req) => `${req.ip}:${req.path}`,
  message: "Too many join actions. Please try again shortly.",
});

const notificationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyBuilder: (req) => `${req.ip}:host-notifications:${req.params.hostUserId || ""}`,
  message: "Too many notification requests. Please slow down.",
});

const getUsersByIdentity = async (identities) => {
  const unique = [...new Set((identities || []).filter(Boolean))];
  if (unique.length === 0) return [];

  const objectIdCandidates = unique.filter((value) => mongoose.Types.ObjectId.isValid(value));
  const uidCandidates = unique;

  if (objectIdCandidates.length === 0) {
    return User.find({ uid: { $in: uidCandidates } }).select("uid name email photo bio location interests");
  }

  return User.find({
    $or: [{ _id: { $in: objectIdCandidates } }, { uid: { $in: uidCandidates } }],
  }).select("uid name email photo bio location interests");
};

const createOrResetJoinNotification = async ({ event, userId }) => {
  const existing = await Notification.findOne({
    hostUserId: event.userId,
    requesterUserId: userId,
    eventId: event._id.toString(),
    type: "join_request",
    status: "pending",
  });

  if (existing) {
    existing.isRead = false;
    existing.message = "New join request received";
    await existing.save();
    return;
  }

  await Notification.create({
    hostUserId: event.userId,
    requesterUserId: userId,
    eventId: event._id.toString(),
    type: "join_request",
    status: "pending",
    isRead: false,
    message: "New join request received",
  });
};

// CREATE
router.post("/", async (req, res) => {
  try {
    const post = await Post.create(req.body);
    res.json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ALL
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ONE
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Event not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JOIN REQUEST
router.post("/:id/join", joinActionLimiter, validateJoinActionBody, async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Post.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (hasEventEnded(event)) {
      return res.status(400).json({ error: "This event has already ended. Joining is closed." });
    }

    if (!event.requests.includes(userId) && !event.attendees.includes(userId)) {
      event.requests.push(userId);
    }

    const existingJoinRequest = event.joinRequests.find(
      (request) => request.userId === userId && request.status === "pending"
    );

    if (!existingJoinRequest && !event.attendees.includes(userId)) {
      event.joinRequests.push({
        userId,
        status: "pending",
        isReadByHost: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await event.save();
    await createOrResetJoinNotification({ event, userId });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APPROVE
router.post("/:id/approve", joinActionLimiter, validateJoinActionBody, async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Post.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    event.requests = event.requests.filter(id => id !== userId);

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

    if (!event.attendees.includes(userId)) {
      event.attendees.push(userId);
    }

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
        message: "Join request approved",
      },
      { new: true }
    );
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REJECT
router.post("/:id/reject", joinActionLimiter, validateJoinActionBody, async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Post.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    event.requests = event.requests.filter(id => id !== userId);

    event.joinRequests = event.joinRequests.map((request) => {
      if (request.userId === userId && request.status === "pending") {
        return {
          ...request.toObject(),
          status: "rejected",
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
        status: "rejected",
        isRead: true,
        message: "Join request rejected",
      },
      { new: true }
    );
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/request-details", async (req, res) => {
  try {
    const event = await Post.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const metadataPendingRequests = event.joinRequests.filter((request) => request.status === "pending");
    const metadataPendingUserIds = new Set(metadataPendingRequests.map((request) => request.userId));
    const legacyOnlyRequests = (event.requests || [])
      .filter((userId) => !metadataPendingUserIds.has(userId))
      .map((userId) => ({
        userId,
        status: "pending",
        isReadByHost: false,
        createdAt: event.updatedAt || event.createdAt,
        updatedAt: event.updatedAt || event.createdAt,
      }));

    const pendingRequests = [...metadataPendingRequests.map((request) => request.toObject()), ...legacyOnlyRequests];
    const requestUserIds = pendingRequests.map((request) => request.userId);
    const users = await getUsersByIdentity(requestUserIds);
    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(user._id.toString(), user);
      if (user.uid) userMap.set(user.uid, user);
    });
    const enrichedRequests = pendingRequests.map((request) => ({
      userId: request.userId,
      status: request.status,
      isReadByHost: request.isReadByHost,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      user: userMap.get(request.userId) || null,
    }));

    res.json({
      eventId: event._id,
      eventTitle: event.title,
      requests: enrichedRequests,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/host/:hostUserId/notifications", notificationLimiter, async (req, res) => {
  try {
    const hostUserId = req.params.hostUserId;
    const hostEvents = await Post.find({ userId: hostUserId }).select("_id title requests joinRequests");
    const hostEventMap = new Map(hostEvents.map((event) => [event._id.toString(), event]));

    const pendingNotifications = await Notification.find({
      hostUserId,
      type: "join_request",
      status: "pending",
    }).sort({ createdAt: -1 });

    if (pendingNotifications.length === 0) {
      const existingEventIds = new Set();
      for (const event of hostEvents) {
        const metadataPendingRequests = event.joinRequests || [];
        const metadataPendingUserIds = new Set(
          metadataPendingRequests
            .filter((request) => request.status === "pending")
            .map((request) => request.userId)
        );

        const legacyUserIds = (event.requests || []).filter(
          (userId) => !metadataPendingUserIds.has(userId)
        );

        for (const userId of legacyUserIds) {
          const dedupeKey = `${event._id}-${userId}`;
          if (existingEventIds.has(dedupeKey)) continue;
          existingEventIds.add(dedupeKey);

          await Notification.create({
            hostUserId,
            requesterUserId: userId,
            eventId: event._id.toString(),
            type: "join_request",
            status: "pending",
            isRead: false,
            message: "New join request received",
          });
        }
      }
    }

    const notificationsFromDb = await Notification.find({
      hostUserId,
      type: "join_request",
      status: "pending",
    }).sort({ createdAt: -1 });

    const requesterIds = notificationsFromDb.map((notification) => notification.requesterUserId);
    const requesters = await getUsersByIdentity(requesterIds);
    const requesterMap = new Map();
    requesters.forEach((requester) => {
      requesterMap.set(requester._id.toString(), requester);
      if (requester.uid) requesterMap.set(requester.uid, requester);
    });

    const notifications = notificationsFromDb.map((notification) => ({
      id: notification._id,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      event: {
        _id: notification.eventId,
        title: hostEventMap.get(notification.eventId)?.title || "Event",
      },
      requester: requesterMap.get(notification.requesterUserId) || null,
    }));

    res.json({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.isRead).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/mark-requests-read", async (req, res) => {
  try {
    const event = await Post.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    event.joinRequests = event.joinRequests.map((request) => {
      if (request.status === "pending") {
        return {
          ...request.toObject(),
          isReadByHost: true,
          updatedAt: new Date(),
        };
      }
      return request;
    });

    await event.save();
    await Notification.updateMany(
      {
        hostUserId: event.userId,
        eventId: event._id.toString(),
        type: "join_request",
        status: "pending",
      },
      {
        $set: {
          isRead: true,
        },
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Event not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Event not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;