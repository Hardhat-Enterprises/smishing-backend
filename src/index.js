// src/index.js
import dotenv from "dotenv";
import express from "express";
 feature/ai-chat-api
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

import securityMiddleware from "./middlewares/security.middleware.js";
import { globalLimiter, authLimiter } from "./middlewares/rateLimiter.middleware.js";

import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import detectionsRoute from "./routes/detections.route.js";
import scanRoutes from "./routes/scan.route.js";
import spamRoute from "./routes/spam.route.js";
import contactRoute from "./routes/contact.route.js";
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/RateLimiter.middleware.js";
import whoisRoutes from "./routes/whois.route.js";


// calling body-parser to handle the Request Object from POST requests
import bodyParser from "body-parser";

const app = express();

// Apply security headers middleware
app.use(securityMiddleware);

// Apply general rate limiter
app.use(apiLimiter);

// Parse incoming JSON requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

import scanRoute from "./routes/scan.route.js";
import chatRoute from "./routes/chat.route.js";
import contactRoute from "./routes/contact.route.js";
import spamRoute from "./routes/spam.route.js";
import authRoute from "./routes/auth.route.js";

feature/ai-chat-api
dotenv.config();
app.use("/whois", whoisRoutes);
// Mount auth routes at /api/auth
app.use("/api/auth", authLimiter, authRoute);

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

 feature/ai-chat-api
// --- 404 Handler ---
app.use((req, res) => {
    res.status(404).json({ error: "Not Found", path: req.path });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
    console.error("server-error", err);
    res.status(err.status || 500).json({ error: err.message || "Server error" });
// Mount spam routes at /api/spam
app.use("/api/spam", spamRoute);

app.use("/api/detections", detectionsRoute);

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// --- Server ---
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT} (env=${process.env.NODE_ENV || "development"})`);
});
