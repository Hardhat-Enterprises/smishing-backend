// src/index.js
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

import securityMiddleware from "./middlewares/security.middleware.js";
import { globalLimiter, authLimiter } from "./middlewares/rateLimiter.middleware.js";

import scanRoute from "./routes/scan.route.js";
import chatRoute from "./routes/chat.route.js";
import contactRoute from "./routes/contact.route.js";
import spamRoute from "./routes/spam.route.js";
import authRoute from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middleware ---
app.use(helmet()); // security headers
app.use(cors()); // allow cross-origin
app.use(morgan("dev")); // request logging
app.use(express.json()); // parse JSON bodies
app.use(securityMiddleware); // custom security checks
app.use(globalLimiter); // global rate limiter

// --- Routes ---
app.use("/api/scan", scanRoute);
app.use("/api/chat", chatRoute);
app.use("/api/spam", spamRoute);
app.use("/api/contact", contactRoute);
app.use("/api/auth", authLimiter, authRoute); // stricter limit on auth

// --- Health check ---
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

// --- 404 Handler ---
app.use((req, res) => {
    res.status(404).json({ error: "Not Found", path: req.path });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
    console.error("server-error", err);
    res.status(err.status || 500).json({ error: err.message || "Server error" });
});

// --- Server ---
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT} (env=${process.env.NODE_ENV || "development"})`);
});
