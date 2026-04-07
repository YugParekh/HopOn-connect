const badRequest = (res, message) => res.status(400).json({ error: message });

const requireNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const validateJoinActionBody = (req, res, next) => {
  const { userId } = req.body || {};
  if (!requireNonEmptyString(userId)) {
    return badRequest(res, "userId is required");
  }
  next();
};

const validateCreateOrderBody = (req, res, next) => {
  const { eventId, userId, amount } = req.body || {};
  if (!requireNonEmptyString(eventId)) return badRequest(res, "eventId is required");
  if (!requireNonEmptyString(userId)) return badRequest(res, "userId is required");
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    return badRequest(res, "amount must be a positive number");
  }
  next();
};

const validateVerifyPaymentBody = (req, res, next) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    eventId,
    userId,
    amount,
  } = req.body || {};

  if (!requireNonEmptyString(razorpayOrderId)) return badRequest(res, "razorpayOrderId is required");
  if (!requireNonEmptyString(razorpayPaymentId)) return badRequest(res, "razorpayPaymentId is required");
  if (!requireNonEmptyString(razorpaySignature)) return badRequest(res, "razorpaySignature is required");
  if (!requireNonEmptyString(eventId)) return badRequest(res, "eventId is required");
  if (!requireNonEmptyString(userId)) return badRequest(res, "userId is required");
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    return badRequest(res, "amount must be a positive number");
  }

  next();
};

const validateAiIdeaBody = (req, res, next) => {
  const { idea } = req.body || {};
  if (!requireNonEmptyString(idea)) {
    return badRequest(res, "Event idea is required");
  }
  if (idea.trim().length > 300) {
    return badRequest(res, "Event idea is too long");
  }
  next();
};

const validateUserUpdateBody = (req, res, next) => {
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

  if (name !== undefined && typeof name !== "string") return badRequest(res, "name must be a string");
  if (bio !== undefined && typeof bio !== "string") return badRequest(res, "bio must be a string");
  if (city !== undefined && typeof city !== "string") return badRequest(res, "city must be a string");
  if (location !== undefined && typeof location !== "string") return badRequest(res, "location must be a string");
  if (interests !== undefined && !Array.isArray(interests)) return badRequest(res, "interests must be an array");
  if (socialMedia !== undefined && (typeof socialMedia !== "object" || Array.isArray(socialMedia))) {
    return badRequest(res, "socialMedia must be an object");
  }
  if (razorpayKeyId !== undefined && typeof razorpayKeyId !== "string") {
    return badRequest(res, "razorpayKeyId must be a string");
  }
  if (razorpayKeySecret !== undefined && typeof razorpayKeySecret !== "string") {
    return badRequest(res, "razorpayKeySecret must be a string");
  }
  if (photoDataUrl !== undefined && photoDataUrl !== null && typeof photoDataUrl !== "string") {
    return badRequest(res, "photoDataUrl must be a base64 string");
  }

  next();
};

module.exports = {
  validateJoinActionBody,
  validateCreateOrderBody,
  validateVerifyPaymentBody,
  validateAiIdeaBody,
  validateUserUpdateBody,
};
