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

import threatIntelRoute from "./routes/threatIntel.route.js";
import chatRoute from "./routes/chat.route.js"; //  my first  addition here

// -------------------------------
//  Middlewares
// -------------------------------
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/RateLimiter.middleware.js";
import { errorHandler } from "./middlewares/ErrorHandler.middleware.js";

import { loggerMiddleware } from "./middlewares/logger.middleware.js";

import cors from "cors";

// -------------------------------
//  Models (used by /api/reports)
// -------------------------------
import Report from "./models/report.model.js";

// -------------------------------
//  ML client (FastAPI @ 8000)
// -------------------------------
import { classifyMessage, fallbackClassify } from "./services/ml.service.js";

// -------------------------------
//  App
// -------------------------------
const app = express();


app.use(loggerMiddleware);

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

app.use("/api/threat-intel", threatIntelRoute);

app.use("/api/chat", chatRoute); //  my second addition here

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
/* 6.7) RULE-BASED GUARDRAILS (post-process the ML output)                */
/* ====================================================================== */
function applyGuardrails(classification, text = "") {
    const cls = { ...classification };
    const t = String(text || "").toLowerCase();

    const hasUrl = /(http|https):\/\/|www\./i.test(t);
    const winWords = /(win|won|prize|reward|gift|lottery|free|claim)/i.test(t);
    const acct = /(account|bank|verify|verification|locked|suspended|update|confirm)/i.test(t);
    const secrets = /(otp|one[-\s]?time|password|pin|cvv|ssn|security code)/i.test(t);
    const urgent = /(urgent|immediately|now|24\s?hrs?|today only)/i.test(t);
    const clicky = /(click|tap|open the link|link below)/i.test(t);

    const p = cls.probabilities || {};
    const pHam = Number(p.ham ?? (cls.label === "ham" ? cls.confidence : 0));
    const pSpam = Number(p.spam ?? (cls.label === "spam" ? cls.confidence : 0));
    const pSmish = Number(p.smishing ?? (cls.label === "smishing" ? cls.confidence : 0));

    const setLabel = (newLabel, reason) => {
        cls.label = newLabel;
        cls.badge = { ham: "Safe", spam: "Spam", smishing: "Smishing" }[newLabel];
        cls.severity = { ham: "low", spam: "medium", smishing: "high" }[newLabel];
        if (reason) cls.rule_reason = reason;
        if (!cls.confidence || cls.confidence > 0.98) cls.confidence = 0.85;
    };

    if ((hasUrl && (acct || secrets)) || (secrets && acct)) {
        if (pHam < 0.95) setLabel("smishing", "rules: url+account/otp");
    }

    if (winWords || (hasUrl && clicky) || urgent) {
        if (cls.label === "ham" && pHam < 0.9) setLabel("spam", "rules: promo/lottery/link/urgency");
    }

    if (hasUrl && (acct || clicky) && cls.label === "ham") {
        if (pHam < 0.9 || pSpam + pSmish > 0.3) setLabel("spam", "rules: url+cta");
    }

    if (cls.label === "ham" && (pSpam > 0.45 || pSmish > 0.4)) {
        setLabel(pSmish >= pSpam ? "smishing" : "spam", "rules: prob nudge");
    }

    return cls;
}

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
/* 8) SERVER BOOT                                                         */
/* ====================================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import analysisRoute from "./routes/analysis.route.js";

const app = express();

// Middleware
app.use(express.json());
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

// Routes
app.use("/api/auth", authRoute);
app.use("/api", analysisRoute); // 👈 ADD THIS

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
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
import chatRoute from "./routes/chat.route.js";   //  my first  addition here  

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
import { checkDomainReputation } from "./services/whois.service.js";
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
app.use("/api/chat", chatRoute);   //  my second addition here  

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
    const messageText = String(  
      req.body?.messageText || req.body?.messageContent || ""  
    ).trim();  
    const url = String(req.body?.url || "");  
    const sourceRaw = String(req.body?.source || "android").trim();  

    if (!messageText) {  
      return res  
        .status(400)  
        .json({ status: "error", message: "messageText is required" });  
    }  

    const source = ["android", "web", "test"].includes(sourceRaw) ? sourceRaw : "android";  

    // Extract domain for blacklist check
    const urlMatch = messageText.match(/https?:\/\/[^\s]+/i);
    let blacklistHit = false;
    if (urlMatch) {
      try {
        const domain = urlMatch[0].replace(/^https?:\/\//i, '').split('/')[0];
        const whois = await checkDomainReputation(domain);
        if (whois && whois.blacklist && whois.blacklist.isHit) {
          blacklistHit = true;
        }
      } catch (err) {
        console.warn("WHOIS check failed:", err.message);
      }
    }

    // Analyze raw text for best accuracy
    const analysis = detectionService.quickHeuristics(messageText);
    const cta = detectionService.detectCtaSequence(messageText);
    const velocity = await detectionService.checkAttackVelocity(messageText);
    const honeycomb = await detectionService.checkCollaborativeIntelligence(messageText);
    const brandMentions = detectionService.extractBrandMentions(messageText);
    const brandMismatch = detectionService.detectBrandMismatch(messageText, phoneNumber, brandMentions);
    const urlAnalysis = await detectionService.analyzeMessageUrls(messageText, brandMentions);

    const ml = await classifyMessage(messageText);  
    if (!ml.ok) console.warn("[ML] Using fallback classifier:", ml.error);  
    const baseClassification = ml.ok ? ml.data : fallbackClassify(messageText);  

    const normalized = detectionService.normalizeClassification(baseClassification);

    // Weighted Voting Integration
    const weightedResult = detectionService.calculateWeightedRisk({
      ml: normalized,
      heuristics: analysis,
      cta: cta,
      blacklist: { isHit: blacklistHit },
      honeycomb: honeycomb,
      brandMismatch: brandMismatch,
      urlAnalysis: urlAnalysis
    });

    const guarded = detectionService.applyGuardrails(normalized, messageText);
    
    // Final classification uses weighted result but keeps guarded rules for safety
    const finalClassification = {
      ...guarded,
      ...weightedResult,
      riskScore: weightedResult.finalScore, // Normalized 0-100 score
      isHighIntent: cta.isHighIntent,
      velocity: velocity,
      honeycomb: honeycomb,
      brandMismatch: brandMismatch,
      urlAnalysis: urlAnalysis
    };

    if (cta.isHighIntent) {
      finalClassification.rule_reason = (finalClassification.rule_reason ? finalClassification.rule_reason + " + " : "") + "High Intent Pattern";
    }

    const { advice, actions } = detectionService.buildAdvice(finalClassification, /(http|https):\/\//i.test(messageText));
    if (velocity.isVelocityAttack) {
      advice.velocity_warning = velocity.warning;
    }
    if (honeycomb.isLiveCampaign) {
      advice.honeycomb_warning = honeycomb.message;
    }
    const deadEnd = urlAnalysis.analysis.find(a => a.liveness.isDeadEnd);
    if (deadEnd) {
      advice.liveness_warning = `🚨 Dead-end link detected: ${deadEnd.liveness.reason}. This is a common tactic in burner smishing campaigns.`;
    }

    const classification = { ...finalClassification, advice, actions };  

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
