import { normalizeText } from '../utils/normalization.js';
import { scrubPii } from './privacy.service.js';
import Report from '../models/report.model.js';

/**
 * Financial CTA Sequence Detector
 * Analyzes the structural intent of a message.
 */
export const detectCtaSequence = (text = "") => {
    const t = String(text || "").toLowerCase();

    const patterns = {
        trigger: [
            /account\s*(issue|problem|locked|suspended|blocked|unauthorized|activity|attempt|at\s*risk)/i,
            /(unusual|suspicious|unknown)\s*(login|activity|transaction)/i,
            /verify\s*(identity|account|details|number)/i,
            /your\s*bank\s*(account|card|access)/i,
        ],
        pressure: [
            /(urgent|immediately|action\s*required|asap|at\s*once|fast)/i,
            /(within|in\s*next)\s*(\d+|24|48|12|one|two)\s*(hours|hrs|days|mins|minutes)/i,
            /(expires|deadline|final\s*notice|cutoff|will\s*be\s*closed)/i,
            /limited\s*time/i,
        ],
        action: [
            /(click|tap|visit|go\s*to|follow|open|use)\s*(the\s*)?(link|url|site|portal|page)/i,
            /(verify|update|confirm|secure|validate)\s*(at|here|below)/i,
            /https?:\/\//i,
            /bit\.ly|tinyurl|t\.co|goo\.gl/i,
        ],
    };

    const hits = {
        trigger: patterns.trigger.some((p) => p.test(t)),
        pressure: patterns.pressure.some((p) => p.test(t)),
        action: patterns.action.some((p) => p.test(t)),
    };

    const hasSequence = hits.trigger && hits.pressure && hits.action;
    const score = (hits.trigger ? 30 : 0) + (hits.pressure ? 30 : 0) + (hits.action ? 30 : 0);

    return {
        hasSequence,
        hits,
        score: Math.min(score, 100),
        isHighIntent: hasSequence || score >= 60,
    };
};

/**
 * Adaptive Confidence-Weighted Voting System
 * Bayesian-like weighting for unified signals.
 */
export const calculateWeightedRisk = (signals = {}) => {
    const weights = {
        blacklist: 1.0,
        ml: 0.4,
        heuristics: 0.6,
    };

    // Conflict Resolution: Blacklist always overrides
    if (signals.blacklist?.isHit) {
        return {
            finalScore: 100,
            label: 'smishing',
            reason: 'Blacklist match (WHOIS/Domain)',
            confidence: 1.0,
            badge: 'Smishing',
            severity: 'high'
        };
    }

    const mlSignal = signals.ml || {};
    const mlScore = mlSignal.label === 'smishing' ? (mlSignal.confidence * 100) :
                    mlSignal.label === 'spam' ? (mlSignal.confidence * 50) : 0;

    const hSignal = signals.heuristics || {};
    const ctaSignal = signals.cta || {};
    
    // Combine standard heuristics and CTA sequence intent
    const heuristicScore = Math.max(hSignal.riskScore || 0, ctaSignal.score || 0);

    let totalScore = 0;
    let totalWeight = 0;

    // ML contribution
    totalScore += mlScore * weights.ml;
    totalWeight += weights.ml;

    // Heuristics contribution
    totalScore += heuristicScore * weights.heuristics;
    totalWeight += weights.heuristics;

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    let label = 'ham';
    if (finalScore >= 75) label = 'smishing';
    else if (finalScore >= 40) label = 'spam';

    const badge = { ham: 'Safe', spam: 'Spam', smishing: 'Smishing' }[label];
    const severity = { ham: 'low', spam: 'medium', smishing: 'high' }[label];

    return {
        finalScore: Math.round(finalScore),
        label,
        badge,
        severity,
        confidence: finalScore / 100,
        factors: {
            ml: mlScore,
            heuristics: heuristicScore,
            ctaHighIntent: ctaSignal.isHighIntent
        }
    };
};

/**
 * Time-of-Attack Velocity Analytics
 * Detects real-time spikes in attack vectors.
 */
export const checkAttackVelocity = async (text = "") => {
    const category = categorizeMessage(text);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    try {
        const stats = await Report.aggregate([
            {
                $match: {
                    createdAt: { $gte: oneHourAgo }
                }
            },
            {
                $project: {
                    category: {
                        $cond: {
                            if: { $regexMatch: { input: "$messageText", regex: /tax|hmrc|irs|revenue/i } }, then: "Tax",
                            else: {
                                $cond: {
                                    if: { $regexMatch: { input: "$messageText", regex: /parcel|delivery|dhl|fedex|ups|post/i } }, then: "Parcel",
                                    else: {
                                        $cond: {
                                            if: { $regexMatch: { input: "$messageText", regex: /bank|card|account|payment/i } }, then: "Financial",
                                            else: {
                                                $cond: {
                                                    if: { $regexMatch: { input: "$messageText", regex: /win|prize|lottery|gift/i } }, then: "Prize",
                                                    else: "Other"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $match: { category: category }
            },
            {
                $count: "count"
            }
        ]);

        const count = stats.length > 0 ? stats[0].count : 0;
        const threshold = 15; // Velocity threshold

        return {
            category,
            count,
            isVelocityAttack: count >= threshold,
            warning: count >= threshold ? `🚨 High volume ${category} campaign detected in your region!` : null
        };
    } catch (err) {
        console.error("Velocity Analytics error:", err);
        return { category, count: 0, isVelocityAttack: false };
    }
};

const categorizeMessage = (text) => {
    const t = text.toLowerCase();
    if (/tax|hmrc|irs|revenue/i.test(t)) return 'Tax';
    if (/parcel|delivery|dhl|fedex|ups|post/i.test(t)) return 'Parcel';
    if (/bank|card|account|payment/i.test(t)) return 'Financial';
    if (/win|prize|lottery|gift/i.test(t)) return 'Prize';
    return 'Other';
};

/**
 * Unified Detection Service
 * Consolidates ML classification, heuristics, and guardrails.
 */

export const quickHeuristics = (text = "") => {
    const t = String(text || "").toLowerCase();
    
    // Homoglyph Detection (Task 1)
    const { normalizedText, isDeceptive } = normalizeText(text);
    const textToAnalyze = normalizedText.toLowerCase();

    const hits = [
        /urgent|verify|locked|suspended/,
        /(http|https):\/\//,
        /gift|prize|win|won|lottery|reward/,
    ].filter((r) => r.test(textToAnalyze)).length;

    // Base risk score increases if deceptive characters found
    let baseScore = 20 + hits * 20;
    if (isDeceptive) baseScore += 30; // High weight for homoglyphs

    const riskScore = Math.min(baseScore, 95);
    const tags = [];
    if (/(http|https):\/\//.test(textToAnalyze)) tags.push("has_link");
    if (/win|gift|prize|reward|lottery/i.test(textToAnalyze)) tags.push("prize_language");
    if (isDeceptive) tags.push("visual_deception_detected");

    return { 
        riskScore, 
        tags, 
        isDeceptive,
        normalizedText: isDeceptive ? normalizedText : null 
    };
};

export const buildAdvice = ({ label = "ham", confidence = 0.5 } = {}, hasUrl = false) => {
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
};

export const normalizeClassification = (ml = {}) => {
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
};

export const applyGuardrails = (classification, text = "") => {
    const cls = { ...classification };
    const t = String(text || "").toLowerCase();

    // Analyze normalized text for guardrails as well
    const { normalizedText } = normalizeText(text);
    const normalizedLower = normalizedText.toLowerCase();

    const checkText = (pattern) => pattern.test(t) || pattern.test(normalizedLower);

    const hasUrl   = checkText(/(http|https):\/\/|www\./i);
    const winWords = checkText(/(win|won|prize|reward|gift|lottery|free|claim)/i);
    const acct     = checkText(/(account|bank|verify|verification|locked|suspended|update|confirm)/i);
    const secrets  = checkText(/(otp|one[-\s]?time|password|pin|cvv|ssn|security code)/i);
    const urgent   = checkText(/(urgent|immediately|now|24\s?hrs?|today only)/i);
    const clicky   = checkText(/(click|tap|open the link|link below)/i);

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
};
