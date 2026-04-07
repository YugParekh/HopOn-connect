const buckets = new Map();

const createRateLimiter = ({ windowMs, max, keyBuilder, message }) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = keyBuilder ? keyBuilder(req) : req.ip;
    const existing = buckets.get(key);

    if (!existing || now > existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      return res.status(429).json({ error: message || "Too many requests, please try again later." });
    }

    existing.count += 1;
    buckets.set(key, existing);
    next();
  };
};

module.exports = { createRateLimiter };
