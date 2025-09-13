// src/middlewares/rateLimiter.middleware.js
import rateLimit from "express-rate-limit";

// Global rate limit (default for all routes)
const globalLimiter = rateLimit({
    windowMs: Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 min
    max: Number(process.env.GLOBAL_RATE_LIMIT_MAX || 300), // 300 requests
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
});

// Auth-specific rate limit
const authLimiter = rateLimit({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60 * 1000), // 1 min
    max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20), // 20 requests
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth requests. Please slow down." },
});

export { globalLimiter, authLimiter };
