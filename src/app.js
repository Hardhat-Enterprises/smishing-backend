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
//  DB
// -------------------------------
import connectDB from "./configs/db.config.js";

// -------------------------------
//  Feature routes
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
import analysisRoute from "./routes/analysis.route.js";

// -------------------------------
//  Middlewares
// -------------------------------
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/RateLimiter.middleware.js";
import { errorHandler } from "./middlewares/ErrorHandler.middleware.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";

// -------------------------------
//  Models
// -------------------------------
import Report from "./models/report.model.js";

// -------------------------------
//  Services
// -------------------------------
import { classifyMessage, fallbackClassify } from "./services/ml.service.js";
import * as detectionService from "./services/detections.service.js";
import { checkDomainReputation } from "./services/whois.service.js";
import { anonymizeReportData } from "./services/privacy.service.js";

// -------------------------------
//  App
// -------------------------------
const app = express();

app.use(loggerMiddleware);
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === "test") {
    app.set("trust proxy", false);
} else {
    app.set("trust proxy", true);
}

// -------------------------------
//  Global middleware
// -------------------------------
app.use(securityMiddleware);
app.use("/api", feedbackRoutes);
app.use(apiLimiter);
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------------------
//  Database connection
// -------------------------------
if (process.env.NODE_ENV !== "test") {
    connectDB();
}

// -------------------------------
//  Route mounting
// -------------------------------
app.use("/api/auth", authLimiter, authRoute);
app.use("/api/contact", contactRoute);
app.use("/api", scanRoutes);
app.use("/api", analysisRoute);
app.use("/api/spam", spamRoute);
app.use("/health", healthRoute);
app.use("/api/userUpdate", userRoute);
app.use("/api/whois", whoisRoutes);
app.use("/api/chat", chatRoute);

// -------------------------------
//  Dev echo route
// -------------------------------
app.post("/test", (req, res) => {
    console.log("📩 Received at /test:", req.body);
    res.json({ status: "ok", received: req.body });
});

// -------------------------------
//  Reports endpoint
// -------------------------------
app.post("/api/reports", async (req, res) => {
    try {
        console.log("Report received:", req.body);

        const phoneNumber = String(req.body?.phoneNumber || "").trim();
        const messageText = String(req.body?.messageText || req.body?.messageContent || "").trim();
        const sourceRaw = String(req.body?.source || "android").trim();

        if (!messageText) {
            return res.status(400).json({
                status: "error",
                message: "messageText is required",
            });
        }

        const source = ["android", "web", "test"].includes(sourceRaw) ? sourceRaw : "android";

        const urlMatch = messageText.match(/https?:\/\/[^\s]+/i);
        let blacklistHit = false;

        if (urlMatch) {
            try {
                const domain = urlMatch[0].replace(/^https?:\/\//i, "").split("/")[0];
                const whois = await checkDomainReputation(domain);

                if (whois && whois.blacklist && whois.blacklist.isHit) {
                    blacklistHit = true;
                }
            } catch (err) {
                console.warn("WHOIS check failed:", err.message);
            }
        }

        const analysis = detectionService.quickHeuristics(messageText);
        const cta = detectionService.detectCtaSequence(messageText);
        const velocity = await detectionService.checkAttackVelocity(messageText);
        const honeycomb = await detectionService.checkCollaborativeIntelligence(messageText);
        const brandMentions = detectionService.extractBrandMentions(messageText);
        const brandMismatch = detectionService.detectBrandMismatch(messageText, phoneNumber, brandMentions);
        const urlAnalysis = await detectionService.analyzeMessageUrls(messageText, brandMentions);

        const ml = await classifyMessage(messageText);

        if (!ml.ok) {
            console.warn("[ML] Using fallback classifier:", ml.error);
        }

        const baseClassification = ml.ok ? ml.data : fallbackClassify(messageText);
        const normalized = detectionService.normalizeClassification(baseClassification);

        const weightedResult = detectionService.calculateWeightedRisk({
            ml: normalized,
            heuristics: analysis,
            cta,
            blacklist: { isHit: blacklistHit },
            honeycomb,
            brandMismatch,
            urlAnalysis,
        });

        const guarded = detectionService.applyGuardrails(normalized, messageText);

        const finalClassification = {
            ...guarded,
            ...weightedResult,
            riskScore: weightedResult.finalScore,
            isHighIntent: cta.isHighIntent,
            velocity,
            honeycomb,
            brandMismatch,
            urlAnalysis,
        };

        if (cta.isHighIntent) {
            finalClassification.rule_reason =
                (finalClassification.rule_reason ? finalClassification.rule_reason + " + " : "") +
                "High Intent Pattern";
        }

        const { advice, actions } = detectionService.buildAdvice(
            finalClassification,
            /(http|https):\/\//i.test(messageText),
        );

        if (velocity.isVelocityAttack) {
            advice.velocity_warning = velocity.warning;
        }

        if (honeycomb.isLiveCampaign) {
            advice.honeycomb_warning = honeycomb.message;
        }

        const deadEnd = urlAnalysis?.analysis?.find((a) => a.liveness?.isDeadEnd);

        if (deadEnd) {
            advice.liveness_warning = `🚨 Dead-end link detected: ${deadEnd.liveness.reason}. This is a common tactic in burner smishing campaigns.`;
        }

        const classification = {
            ...finalClassification,
            advice,
            actions,
        };

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
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

// -------------------------------
//  Error handler
// -------------------------------
app.use(errorHandler);

export default app;
