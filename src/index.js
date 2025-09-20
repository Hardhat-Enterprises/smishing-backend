// src/index.js
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./configs/db.config.js";

// --- Middlewares ---
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/RateLimiter.middleware.js";
import { errorHandler } from "./middlewares/ErrorHandler.middleware.js";

// --- Routes ---
import authRoute from "./routes/auth.route.js";
import scanRoute from "./routes/scan.route.js";
import chatRoute from "./routes/chat.route.js";
import contactRoute from "./routes/contact.route.js";
import spamRoute from "./routes/spam.route.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import whoisRoutes from "./routes/whois.route.js";
import healthRoute from "./routes/health.route.js";
import userRoute from "./routes/userUpdate.route.js";

// --- Models / Services ---
import Report from "./models/report.model.js";
import { classifyMessage, fallbackClassify } from "./services/ml.service.js";

// -------------------------------
//  Init
// -------------------------------
dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

app.set("trust proxy", true);

// --- Core middlewares ---
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(securityMiddleware);
app.use(apiLimiter);

// --- Routes ---
app.use("/api/auth", authLimiter, authRoute);
app.use("/api/scan", scanRoute);
app.use("/api/chat", chatRoute);
app.use("/api/spam", spamRoute);
app.use("/api/contact", contactRoute);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/whois", whoisRoutes);
app.use("/api/userUpdate", userRoute);
app.use("/health", healthRoute);

// --- Reports (ML classification + advice) ---
app.post("/api/reports", async (req, res) => {
  try {
    console.log("Report received:", req.body);

    const phoneNumber = String(req.body?.phoneNumber || "").trim();
    const messageText = String(req.body?.messageText || req.body?.messageContent || "").trim();
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

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

// --- Error handler ---
app.use(errorHandler);

// --- Server ---
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT} (env=${process.env.NODE_ENV || "development"})`);
});

export default app;

/* ====================================================================== */
/* Helpers for classification (kept self-contained in index.js)          */
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

  if ((hasUrl && (acct || secrets)) || (secrets && acct)) {
    if (pHam < 0.95) setLabel("smishing", "rules: url+account/otp");
  }

  if (winWords || (hasUrl && clicky) || urgent) {
    if (cls.label === "ham" && pHam < 0.90) setLabel("spam", "rules: promo/lottery/link/urgency");
  }

  if (hasUrl && (acct || clicky) && cls.label === "ham") {
    if (pHam < 0.90 || (pSpam + pSmish) > 0.30) setLabel("spam", "rules: url+cta");
  }

  if (cls.label === "ham" && (pSpam > 0.45 || pSmish > 0.40)) {
    setLabel(pSmish >= pSpam ? "smishing" : "spam", "rules: prob nudge");
  }

  return cls;
}
