// -------------------------------
//  Load environment variables
// -------------------------------
import "dotenv/config";

// -------------------------------
//  Core server
// -------------------------------
import express from "express";

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
import chatRoute from "./routes/chat.route.js"; //  my first  addition here

// -------------------------------
//  Middlewares
// -------------------------------
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/RateLimiter.middleware.js";
import { errorHandler } from "./middlewares/ErrorHandler.middleware.js";
import cors from "cors";

// -------------------------------
//  Models (used by /api/reports)
// -------------------------------
import Report from "./models/report.model.js";

// -------------------------------
//  Services
// -------------------------------
import { classifyMessage, fallbackClassify } from "./services/ml.service.js";
import * as detectionService from "./services/detections.service.js";
import { anonymizeReportData } from "./services/privacy.service.js";

// -------------------------------
//  App
// -------------------------------
const app = express();

app.use(express.json());
app.use(cors());
// So req.ip is real when behind nginx/Cloudflare/Render/etc.
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

// Connect to MongoDB
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
app.use("/api/chat", chatRoute); //  my second addition here

/* ====================================================================== */
/* 4) DEV ECHO (optional)                                                 */
/* ====================================================================== */
app.post("/test", (req, res) => {
    console.log("📩 Received at /test:", req.body);
    res.json({ status: "ok", received: req.body });
});

/* ====================================================================== */
/* 7) REPORTS ENDPOINT (ML classification + advice)                       */
/* ====================================================================== */
app.post("/api/reports", async (req, res) => {
    try {
        console.log("Report received:", req.body);

        const phoneNumber = String(req.body?.phoneNumber || "").trim();
        const messageText = String(req.body?.messageText || req.body?.messageContent || "").trim();
        const url = String(req.body?.url || "");
        const sourceRaw = String(req.body?.source || "android").trim();

        if (!messageText) {
            return res.status(400).json({ status: "error", message: "messageText is required" });
        }

        const source = ["android", "web", "test"].includes(sourceRaw) ? sourceRaw : "android";

        // Analyze raw text for best accuracy
        const analysis = detectionService.quickHeuristics(messageText);

        const ml = await classifyMessage(messageText);
        if (!ml.ok) console.warn("[ML] Using fallback classifier:", ml.error);
        const baseClassification = ml.ok ? ml.data : fallbackClassify(messageText);

        const normalized = detectionService.normalizeClassification(baseClassification);
        const guarded = detectionService.applyGuardrails(normalized, messageText);

        const { advice, actions } = detectionService.buildAdvice(guarded, /(http|https):\/\//i.test(messageText));
        const classification = { ...guarded, advice, actions };

        // TASK 2: Scrub PII before saving to DB
        const reportData = anonymizeReportData({
            phoneNumber,
            messageText,
            source,
            metadata: req.body?.metadata || {},
            analysis,
            classification,
        });

        const doc = await Report.create(reportData);

        return res.status(201).json({
            status: "classified",
            reportId: doc._id,
            createdAt: doc.createdAt,
            classification,
            analysis,
        });
    } catch (err) {
        console.error("Error saving report:", err);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
});

/* ====================================================================== */
/* 8) SERVER BOOT                                                         */
/* ====================================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
