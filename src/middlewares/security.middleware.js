// src/middlewares/security.middleware.js

// Example: basic middleware for adding security headers / checks
export default function securityMiddleware(req, res, next) {
    // Example extra validation
    if (req.method === "POST" && !req.is("application/json")) {
        return res.status(415).json({ error: "Content-Type must be application/json" });
    }

    // Custom header for all responses
    res.setHeader("X-App-Security", "enabled");

    next();
}
