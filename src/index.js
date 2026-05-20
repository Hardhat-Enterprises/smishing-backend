// -------------------------------
//  Load environment variables
// -------------------------------
import "dotenv/config";

// -------------------------------
//  Core server
// -------------------------------
import express from "express";
import cors from "cors";

// -------------------------------
//  DB (Mongoose -> MongoDB Atlas)
// -------------------------------
import connectDB from "./configs/db.config.js";

// -------------------------------
//  Feature routes (existing)
// -------------------------------
import authRoute from "./routes/auth.route.js";
import scanRoutes from "./routes/scan.route.js";
import spamRoute from "./routes/spam.route.js";
import contactRoute from "./routes/contact.route.js";
import healthRoute from "./routes/health.route.js";
import userRoute from "./routes/userUpdate.route.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import whoisRoutes from "./routes/whois.route.js";
import chatRoute from "./routes/chat.route.js";
import reportRoute from "./routes/report.route.js";

// -------------------------------
//  Middlewares
// -------------------------------
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/RateLimiter.middleware.js";
import { errorHandler } from "./middlewares/ErrorHandler.middleware.js";

// -------------------------------
//  App
// -------------------------------
const app = express();

app.use(express.json());
app.use(cors());
app.set("trust proxy", true);

/* ====================================================================== */
/* 1) GLOBAL MIDDLEWARES                                                  */
/* ====================================================================== */
app.use(securityMiddleware);

// Mount the feedback routes under the '/api' path
app.use("/api", feedbackRoutes);

// Apply general rate limiter
app.use(apiLimiter);
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true }));

// Apply error handler
app.use(errorHandler);

/* ====================================================================== */
/* 2) DATABASE CONNECTION                                                 */
/* ====================================================================== */
connectDB();

/* ====================================================================== */
/* 3) ROUTE MOUNTING (existing + userUpdate)                              */
/* ====================================================================== */
app.use("/api/auth", authLimiter, authRoute);
app.use("/api/contact", contactRoute);
app.use("/api", scanRoutes);
app.use("/api/spam", spamRoute);
app.use("/health", healthRoute);
app.use("/api/userUpdate", userRoute);
app.use("/api/whois", whoisRoutes);
app.use("/api/chat", chatRoute);
app.use("/api", reportRoute);

/* ====================================================================== */
/* 4) DEV ECHO (optional)                                                 */
/* ====================================================================== */
app.post("/test", (req, res) => {
    console.log("📩 Received at /test:", req.body);
    res.json({ status: "ok", received: req.body });
});

/* ====================================================================== */
/* 5) SERVER BOOT                                                         */
/* ====================================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
