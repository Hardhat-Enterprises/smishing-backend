import { rateLimit } from "express-rate-limit";

// Limit repeated login attempts
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // max 10 requests in 15 minutes
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again later.",
    },
});
