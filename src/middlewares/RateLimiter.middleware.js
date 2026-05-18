import rateLimit from "express-rate-limit";

// General API limiter (100 requests/15 minutes)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: "Too many requests, please try again later.",
        status: 429,
    },
});

// Stricter auth rate limiter: keep login attempts tight at 5 requests per 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: "Too many login attempts, please try again later.",
        status: 429,
    },
});
