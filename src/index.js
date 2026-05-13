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
//  Feature routes
// -------------------------------
import authRoute from "./routes/auth.route.js";
import scanRoutes from "./routes/scan.route.js";
import spamRoute from "./routes/spam.route.js";
import contactRoute from "./routes/contact.route.js";
import healthRoute from "./routes/health.route.js";

// -------------------------------
//  Middlewares
// -------------------------------
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimiter.middleware.js";

// -------------------------------
//  Models
// -------------------------------
import Report from "./models/report.model.js";

// -------------------------------
//  ⭐ ML client (FastAPI @ 8000)
// -------------------------------
import { classifyMessage, fallbackClassify } from "./services/ml.service.js";

// -------------------------------
//  App
// -------------------------------
const app = express();

/* ====================================================================== */
/* 1) GLOBAL MIDDLEWARES                                                  */
/* ====================================================================== */
app.use(securityMiddleware);
app.use(apiLimiter);
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true }));

/* ====================================================================== */
/* 2) DATABASE CONNECTION                                                 */
/* ====================================================================== */
connectDB();

/* ====================================================================== */
/* 3) ROUTE MOUNTING                                                      */
/* ====================================================================== */
app.use("/api/auth", authLimiter, authRoute);
app.use("/api/contact", contactRoute);
app.use("/api", scanRoutes);
app.use("/api/spam", spamRoute);
app.use("/health", healthRoute);

/* ====================================================================== */
/* 4) DEV ECHO (optional)                                                 */
/* ====================================================================== */
app.post("/test", (req, res) => {
    console.log("📩 Received at /test:", req.body);
    res.json({ status: "ok", received: req.body });
});

/* ====================================================================== */
/* 5) LIGHT HEURISTICS (for transparency in UI/logs)                      */
/* ====================================================================== */
function quickHeuristics(text = "") {
    const t = String(text || "").toLowerCase();
    const hits = [/urgent|verify|locked|suspended/, /(http|https):\/\//, /gift|prize|win|won|lottery|reward/].filter(
        (r) => r.test(t),
    ).length;

    const riskScore = Math.min(20 + hits * 20, 95);
    const tags = [];
    if (/http/.test(t)) tags.push("has_link");
    if (/win|gift|prize|reward|lottery/i.test(t)) tags.push("prize_language");
    return { riskScore, tags };
}

/* ====================================================================== */
/* 6) DYNAMIC ADVICE (user-facing message)                                */
/* ====================================================================== */
function buildAdvice({ label = "ham", confidence = 0.5 } = {}, hasUrl = false) {
    const pct = Math.round((Number(confidence) || 0) * 100);
    const lower = String(label || "").toLowerCase();

    if (lower === "smishing" && confidence >= 0.9) {
        return {
            advice: `⚠️ High risk smishing (${pct}%). Do not reply and do not click any links. Block the sender and report it.`,
            actions: ["Block the sender", "Do not click links", "Report as spam/smishing"],
        };
    }
    if (lower === "smishing") {
        return {
            advice: `Suspicious (${pct}%). Avoid links, verify the sender via official channels, and never share OTPs or passwords.`,
            actions: ["Avoid links", "Verify via official app/website", "Never share codes/passwords"],
        };
    }
    if (lower === "spam") {
        return {
            advice: `Likely unwanted marketing (${pct}%). Ignore or block if unsolicited.`,
            actions: ["Ignore message", "Block sender if needed"],
        };
    }
    return {
        advice: `Likely safe (${pct}%). Still be cautious${hasUrl ? " with links" : ""} and verify unusual requests.`,
        actions: ["Be cautious", "Verify unusual requests"],
    };
}

/* ====================================================================== */
/* 6.5) NORMALIZE ML CLASSIFICATION TO MONGO ENUM                         */
/* ====================================================================== */
function normalizeClassification(ml = {}) {
    const toStr = (v) =>
        String(v ?? "")
            .trim()
            .toLowerCase();

    const rawLabel = toStr(ml.label);
    const rawBadge = toStr(ml.badge);
    const probs = ml.probabilities || {};

    const fromBadge = { safe: "ham", spam: "spam", smishing: "smishing" }[rawBadge];
    const mapText = (s) => {
        if (["ham", "safe", "legit"].includes(s)) return "ham";
        if (["spam", "ad", "promo", "marketing"].includes(s)) return "spam";
        if (["smishing", "phishing", "fraud", "scam"].includes(s)) return "smishing";
        return null;
    };

    let label = fromBadge || mapText(rawLabel) || (rawLabel === "1" ? "spam" : rawLabel === "0" ? "ham" : null);

    if (!label && Object.keys(probs).length) {
        const entries = Object.entries(probs).sort((a, b) => Number(b[1]) - Number(a[1]));
        label = mapText(toStr(entries[0][0]));
    }
    if (!label) label = "spam";

    let confidence = Number(ml.confidence ?? 0);
    if (confidence > 1) confidence = confidence / 100;
    if (!confidence && Object.keys(probs).length) {
        confidence = Math.max(...Object.values(probs).map(Number));
    }

    const badge = { ham: "Safe", spam: "Spam", smishing: "Smishing" }[label];
    const severity = { ham: "low", spam: "medium", smishing: "high" }[label];

    return {
        label,
        badge,
        confidence,
        probabilities: probs,
        severity,
        model_version: ml.model_version || "unknown",
    };
}

/* ====================================================================== */
/* 6.7) RULE-BASED GUARDRAILS + CONFIDENCE CALIBRATION                    */
/* ====================================================================== */
function applyGuardrails(classification, text = "") {
    const cls = { ...classification };
    const t = String(text || "").toLowerCase();

    const hasUrl = /(http|https):\/\/|www\./i.test(t);
    const winWords = /(win|won|prize|reward|gift|lottery|free|claim|discount|offer)/i.test(t);
    const acct = /(account|bank|verify|verification|locked|suspended|update|confirm)/i.test(t);
    const secrets = /(otp|one[-\s]?time|password|pin|cvv|ssn|security code)/i.test(t);
    const urgent = /(urgent|immediately|now|24\s?hrs?|today only)/i.test(t);
    const clicky = /(click|tap|open the link|link below|visit)/i.test(t);

    const p = cls.probabilities || {};
    const pHam = Number(p.ham ?? (cls.label === "ham" ? cls.confidence : 0));
    const pSpam = Number(p.spam ?? (cls.label === "spam" ? cls.confidence : 0));
    const pSmish = Number(p.smishing ?? (cls.label === "smishing" ? cls.confidence : 0));

    const setLabel = (newLabel, reason, minConfidence = 0.85) => {
        cls.label = newLabel;
        cls.badge = { ham: "Safe", spam: "Spam", smishing: "Smishing" }[newLabel];
        cls.severity = { ham: "low", spam: "medium", smishing: "high" }[newLabel];
        if (reason) cls.rule_reason = reason;
        cls.confidence = Math.max(Number(cls.confidence || 0), minConfidence);
    };

    // Strong smishing patterns
    if ((hasUrl && (acct || secrets)) || (secrets && acct)) {
        if (pHam < 0.95) setLabel("smishing", "rules: url+account/otp", 0.92);
    }

    // Marketing / promo spam patterns
    if (winWords || (hasUrl && clicky) || urgent) {
        if (cls.label === "ham" && pHam < 0.9) setLabel("spam", "rules: promo/lottery/link/urgency", 0.72);
    }

    // URL + CTA/verify => at least spam
    if (hasUrl && (acct || clicky) && cls.label === "ham") {
        if (pHam < 0.9 || pSpam + pSmish > 0.3) setLabel("spam", "rules: url+cta", 0.75);
    }

    // If model leans spam/smishing but barely, nudge off ham
    if (cls.label === "ham" && (pSpam > 0.45 || pSmish > 0.4)) {
        setLabel(pSmish >= pSpam ? "smishing" : "spam", "rules: prob nudge", 0.7);
    }

    // -------------------------
    // Confidence calibration
    // -------------------------
    const looksVerySafe = !hasUrl && !winWords && !acct && !secrets && !urgent && !clicky;

    const looksVerySuspicious = (hasUrl && (acct || secrets)) || (urgent && hasUrl) || (acct && secrets);

    if (cls.label === "ham") {
        // For obviously normal messages, avoid weak-looking 55% safe output
        if (looksVerySafe) {
            cls.confidence = Math.max(Number(cls.confidence || 0), 0.9);
        } else {
            cls.confidence = Math.max(Number(cls.confidence || 0), 0.72);
        }
    }

    if (cls.label === "spam") {
        cls.confidence = Math.max(Number(cls.confidence || 0), 0.72);
    }

    if (cls.label === "smishing") {
        if (looksVerySuspicious) {
            cls.confidence = Math.max(Number(cls.confidence || 0), 0.94);
        } else {
            cls.confidence = Math.max(Number(cls.confidence || 0), 0.88);
        }
    }

    return cls;
}

/* ====================================================================== */
/* 7) REPORTS ENDPOINT (ML classification + advice)                       */
/* ====================================================================== */
/**
 * POST /api/reports
 * Body:
 *  - messageText (required) or messageContent (fallback)
 *  - phoneNumber (optional)
 *  - url (optional)
 *  - source (optional: "android" | "web" | "test")
 *  - metadata (optional)
 */
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

        const analysis = quickHeuristics(messageText);

        const ml = await classifyMessage(messageText);
        if (!ml.ok) console.warn("[ML] Using fallback classifier:", ml.error);
        const baseClassification = ml.ok ? ml.data : fallbackClassify(messageText);

        const normalized = normalizeClassification(baseClassification);
        const guarded = applyGuardrails(normalized, messageText);

        const { advice, actions } = buildAdvice(guarded, /(http|https):\/\//i.test(messageText));
        const classification = { ...guarded, advice, actions };

        const doc = await Report.create({
            phoneNumber: phoneNumber || undefined,
            messageText,
            source,
            metadata: req.body?.metadata || {},
            analysis,
            classification,
        });

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
/* 8) REPORT REVIEW & ANALYTICS                                           */
/* ====================================================================== */

// Get all reports with optional filters/sorting
app.get("/api/reports", async (req, res) => {
    try {
        const { label, severity, status, sortBy = "createdAt", order = "desc" } = req.query;

        const query = {};
        if (label) query["classification.label"] = label;
        if (severity) query["classification.severity"] = severity;
        if (status) query.status = status;

        const allowedSortFields = ["createdAt", "analysis.riskScore"];
        const finalSortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const finalSortOrder = order === "asc" ? 1 : -1;

        const reports = await Report.find(query).sort({ [finalSortField]: finalSortOrder });

        return res.status(200).json({
            success: true,
            count: reports.length,
            reports,
        });
    } catch (err) {
        console.error("Error fetching reports:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reports",
        });
    }
});

// Review a report
app.patch("/api/reports/:id/review", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewedBy, reviewNotes, correctedLabel } = req.body;

        const report = await Report.findById(id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        if (status) report.status = status;
        if (reviewedBy) report.reviewedBy = reviewedBy;
        if (reviewNotes !== undefined) report.reviewNotes = reviewNotes;
        if (correctedLabel) report.correctedLabel = correctedLabel;

        report.reviewedAt = new Date();

        await report.save();

        return res.status(200).json({
            success: true,
            message: "Report reviewed successfully",
            report,
        });
    } catch (err) {
        console.error("Error reviewing report:", err);
        return res.status(500).json({
            success: false,
            message: "Review failed",
        });
    }
});

// Analytics summary
app.get("/api/reports/analytics", async (req, res) => {
    try {
        const labelCounts = await Report.aggregate([{ $group: { _id: "$classification.label", total: { $sum: 1 } } }]);

        const statusCounts = await Report.aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }]);

        const severityCounts = await Report.aggregate([
            { $group: { _id: "$classification.severity", total: { $sum: 1 } } },
        ]);

        return res.status(200).json({
            success: true,
            analytics: {
                labelCounts,
                statusCounts,
                severityCounts,
            },
        });
    } catch (err) {
        console.error("Error generating analytics:", err);
        return res.status(500).json({
            success: false,
            message: "Analytics failed",
        });
    }
});

// Export reviewed reports for retraining
app.get("/api/reports/export/reviewed", async (req, res) => {
    try {
        const reports = await Report.find({
            status: "reviewed",
        }).sort({ reviewedAt: -1 });

        const exportData = reports.map((report) => ({
            id: report._id,
            messageText: report.messageText,
            predictedLabel: report.classification?.label || "",
            correctedLabel: report.correctedLabel || "",
            finalLabel: report.correctedLabel || report.classification?.label || "",
            reviewedBy: report.reviewedBy || "",
            reviewNotes: report.reviewNotes || "",
            reviewedAt: report.reviewedAt || null,
            createdAt: report.createdAt || null,
        }));

        return res.status(200).json({
            success: true,
            count: exportData.length,
            data: exportData,
        });
    } catch (err) {
        console.error("Error exporting reviewed reports:", err);
        return res.status(500).json({
            success: false,
            message: "Export failed",
        });
    }
});

/* ====================================================================== */
/* 9) SERVER BOOT                                                         */
/* ====================================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
