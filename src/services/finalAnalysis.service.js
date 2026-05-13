const analyzeMessage = async (message) => {
    const text = message.toLowerCase();
    let score = 0;
    let reasons = [];

    // Financial scam keywords
    const financialKeywords = ["bank", "payment", "invoice", "credit card", "refund", "transaction", "billing"];

    // Verification/security keywords
    const verificationKeywords = ["account", "verify", "password", "login"];

    // Delivery / parcel scam keywords
    const deliveryKeywords = [
        "parcel",
        "delivery",
        "shipment",
        "package",
        "track your package",
        "update your address",
        "redelivery",
        "courier",
    ];

    // Gift card / impersonation scam keywords
    const giftCardKeywords = ["gift card", "apple gift card", "google play card", "steam card", "send the code"];

    // Urgency words
    const urgencyWords = ["urgent", "now", "immediately", "asap", "act fast", "limited time"];

    // Suspicious phishing phrases
    const suspiciousPhrases = [
        "account is blocked",
        "verify your account",
        "confirm your identity",
        "suspended account",
        "click here",
        "login immediately",
    ];

    // Safe OTP phrases
    const safeOtpPhrases = ["never share this code", "your otp is"];

    // Financial keywords scoring
    financialKeywords.forEach((word) => {
        if (text.includes(word)) {
            score += 20;
            reasons.push(`Financial keyword detected: ${word}`);
        }
    });

    // Verification keywords scoring
    verificationKeywords.forEach((word) => {
        if (text.includes(word)) {
            score += 15;
            reasons.push(`Security keyword detected: ${word}`);
        }
    });

    // Delivery scam scoring
    deliveryKeywords.forEach((word) => {
        if (text.includes(word)) {
            score += 10;
            reasons.push(`Delivery-related keyword detected: ${word}`);
        }
    });

    // Gift card scam scoring
    giftCardKeywords.forEach((word) => {
        if (text.includes(word)) {
            score += 25;
            reasons.push(`Gift card scam keyword detected: ${word}`);
        }
    });

    // URL detection
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const urls = text.match(urlRegex);

    if (urls && urls.length > 0) {
        score += 20;
        reasons.push("Contains URL");

        const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl"];

        const hasShortener = urls.some((url) => shorteners.some((shortener) => url.includes(shortener)));

        if (hasShortener) {
            score += 25;
            reasons.push("Contains shortened URL");
        }
    }

    // Urgency scoring
    urgencyWords.forEach((word) => {
        if (text.includes(word)) {
            score += 15;
            reasons.push(`Urgency word detected: ${word}`);
        }
    });

    // Suspicious phrase scoring
    suspiciousPhrases.forEach((phrase) => {
        if (text.includes(phrase)) {
            score += 20;
            reasons.push(`Suspicious phrase detected: ${phrase}`);
        }
    });

    // Safe OTP reduction logic
    safeOtpPhrases.forEach((phrase) => {
        if (text.includes(phrase)) {
            score -= 15;
            reasons.push("Legitimate OTP-style message detected");
        }
    });

    // Prevent negative scores
    if (score < 0) {
        score = 0;
    }

    // Add baseline score for safe messages
    if (score === 0) {
        score = 5;
    }

    // Remove duplicate reasons
    reasons = [...new Set(reasons)];

    // Risk classification
    let riskLevel = "LOW";

    if (score >= 60) {
        riskLevel = "HIGH";
    } else if (score >= 30) {
        riskLevel = "MEDIUM";
    }

    return {
        message,
        score,
        riskLevel,
        reasons,
    };
};

export { analyzeMessage };
