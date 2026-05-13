// src/controllers/report.controller.js
import { classifyMessage, fallbackClassify } from "../services/ml.service.js";

export async function analyzeReport(req, res) {
    const { message, url } = req.body || {};
    let result;
    let usedFallback = false;

    const ml = await classifyMessage({ message, url });
    if (ml.ok) {
        result = ml.data;
    } else {
        usedFallback = true;
        result = fallbackClassify(message);
    }

    const reply = makeDynamicReply(result);

    return res.json({
        verdict: result.label,
        confidence: result.confidence,
        model_version: result.model_version,
        source: result.source ?? (usedFallback ? "fallback" : "ml"),
        probabilities: result.probabilities,
        reply,
    });
}

function makeDynamicReply(out) {
    const score = typeof out.confidence === "number" ? out.confidence : 0.5;
    const pct = Math.round(score * 100);
    const label = (out.label || "").toLowerCase();

    if (label === "smishing" && score >= 0.9)
        return `⚠️ High risk smishing (${pct}%). Do not click or reply. Block and report.`;
    if (label === "smishing")
        return `Suspicious (${pct}%). Avoid links, verify the sender via official channels, and never share OTPs.`;
    if (label === "spam") return `Likely unwanted marketing (${pct}%). Ignore or block if unsolicited.`;
    return `Likely safe (${pct}%). Still be cautious—never share sensitive info and verify unusual requests.`;
}
