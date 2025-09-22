// src/services/ml.service.js
const ML_BASE_URL =
    process.env.ML_SERVICE_URL || // <- your .env key
    process.env.ML_BASE_URL || // <- fallback key
    "http://127.0.0.1:8000";

export async function classifyMessage(text) {
    if (!text) {
        return { ok: false, data: { label: "ham", badge: "Safe", confidence: 0.5, probabilities: { ham: 1 } } };
    }
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const resp = await fetch(`${ML_BASE_URL}/predict`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!resp.ok) throw new Error(`ML responded ${resp.status}`);
        const data = await resp.json();
        return { ok: true, data };
    } catch (err) {
        console.error("ML service error:", err.message);
        return { ok: false, data: { label: "ham", badge: "Safe", confidence: 0.5, probabilities: { ham: 1 } } };
    }
}

export function fallbackClassify(text) {
    const t = String(text || "").toLowerCase();
    const rules = [/urgent|verify|locked|suspended/, /(http|https):\/\//, /gift|prize|win|won|lottery|reward/];
    const hits = rules.filter((r) => r.test(t)).length;

    let label = "ham";
    if (hits >= 2) label = "smishing";
    else if (hits === 1) label = "spam";

    const confidence = hits === 0 ? 0.55 : hits === 1 ? 0.72 : 0.93;
    const badge = label === "ham" ? "Safe" : label === "spam" ? "Spam" : "Smishing";
    return { label, badge, confidence, probabilities: { [label]: confidence } };
}
