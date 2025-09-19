// -------------------------------
//  Load environment variables
// -------------------------------
import "dotenv/config";

// -------------------------------
//  Core server
// -------------------------------
import express from "express";
import authRoutes from "./routes/auth.route.js";

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

// -------------------------------
//  Middlewares 
// -------------------------------
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/RateLimiter.middleware.js";
import { errorHandler } from "./middlewares/ErrorHandler.middleware.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import cors from "cors";

// -------------------------------
//  Models (used by /api/reports)
// -------------------------------
import Report from "./models/report.model.js";
import whoisRoutes from "./routes/whois.route.js";


// -------------------------------
//  ML client (FastAPI @ 8000)
// -------------------------------
import { classifyMessage, fallbackClassify } from "./services/ml.service.js";

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

// Mount contact routes at /api/contact
app.use("/api/contact", contactRoute);
app.use("/api", scanRoutes);
app.use("/api/spam", spamRoute);
app.use("/health", healthRoute);
app.use("/api/userUpdate", userRoute);

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
  const hits = [
    /urgent|verify|locked|suspended/,
    /(http|https):\/\//,
    /gift|prize|win|won|lottery|reward/,
  ].filter((r) => r.test(t)).length;

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
  const toStr = (v) => String(v ?? "").trim().toLowerCase();

  const rawLabel = toStr(ml.label);
  const rawBadge = toStr(ml.badge);
  const probs = ml.probabilities || {};

  const fromBadge = ({ safe: "ham", spam: "spam", smishing: "smishing" })[rawBadge];
  const mapText = (s) => {
    if (["ham", "safe", "legit"].includes(s)) return "ham";
    if (["spam", "ad", "promo", "marketing"].includes(s)) return "spam";
    if (["smishing", "phishing", "fraud", "scam"].includes(s)) return "smishing";
    return null;
  };

  let label =
    fromBadge ||
    mapText(rawLabel) ||
    (rawLabel === "1" ? "spam" : rawLabel === "0" ? "ham" : null);

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

  const hasUrl   = /(http|https):\/\/|www\./i.test(t);
  const winWords = /(win|won|prize|reward|gift|lottery|free|claim)/i.test(t);
  const acct     = /(account|bank|verify|verification|locked|suspended|update|confirm)/i.test(t);
  const secrets  = /(otp|one[-\s]?time|password|pin|cvv|ssn|security code)/i.test(t);
  const urgent   = /(urgent|immediately|now|24\s?hrs?|today only)/i.test(t);
  const clicky   = /(click|tap|open the link|link below)/i.test(t);

  const p = cls.probabilities || {};
  const pHam   = Number(p.ham ?? (cls.label === "ham" ? cls.confidence : 0));
  const pSpam  = Number(p.spam ?? (cls.label === "spam" ? cls.confidence : 0));
  const pSmish = Number(p.smishing ?? (cls.label === "smishing" ? cls.confidence : 0));

  const setLabel = (newLabel, reason) => {
    cls.label = newLabel;
    cls.badge = { ham: "Safe", spam: "Spam", smishing: "Smishing" }[newLabel];
    cls.severity = { ham: "low", spam: "medium", smishing: "high" }[newLabel];
    if (reason) cls.rule_reason = reason;
    if (!cls.confidence || cls.confidence > 0.98) cls.confidence = 0.85;
  };

  // Strong smishing patterns: URL + credential/verification talk
  if ((hasUrl && (acct || secrets)) || (secrets && acct)) {
    if (pHam < 0.95) setLabel("smishing", "rules: url+account/otp");
  }

  // Marketing/lottery spam patterns
  if (winWords || (hasUrl && clicky) || urgent) {
    if (cls.label === "ham" && pHam < 0.90) setLabel("spam", "rules: promo/lottery/link/urgency");
  }

  // URL + CTA/verify → at least spam unless model is very sure it's ham
  if (hasUrl && (acct || clicky) && cls.label === "ham") {
    if (pHam < 0.90 || (pSpam + pSmish) > 0.30) setLabel("spam", "rules: url+cta");
  }

  // If model leans spam/smishing but barely, nudge off ham
  if (cls.label === "ham" && (pSpam > 0.45 || pSmish > 0.40)) {
    setLabel(pSmish >= pSpam ? "smishing" : "spam", "rules: prob nudge");
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
      analysis,           // { riskScore, tags }
      classification,     // { label, badge, confidence, ... }
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

export default app;
