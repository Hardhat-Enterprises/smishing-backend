const analyzeMessage = async (message) => {
    const text = message.toLowerCase();

    let score = 0;
    let reasons = [];

    // Scam categories
    const scamCategories = {
        "BANKING PHISHING": [
            "bank",
            "account",
            "login",
            "verify",
            "password",
            "transaction",
            "credit card",
            "suspended account",
        ],

        "DELIVERY SCAM": [
            "parcel",
            "delivery",
            "shipment",
            "package",
            "courier",
            "redelivery",
            "track your package",
            "update your address",
        ],

        "GIFT CARD SCAM": [
            "gift card",
            "apple gift card",
            "google play card",
            "steam card",
            "voucher",
            "send the code",
        ],

        "LOTTERY SCAM": ["lottery", "winner", "jackpot", "claim prize", "cash reward"],

        "JOB SCAM": ["job offer", "work from home", "earn money", "salary", "interview", "part time"],

        "OTP SCAM": ["otp", "verification code", "security code", "your otp is"],

        "INVESTMENT SCAM": ["investment", "crypto", "bitcoin", "returns", "profit", "trading"],

        "LOAN SCAM": ["loan approved", "instant loan", "low interest", "emi", "credit limit"],
    };

    // Risk scoring keywords
    const financialKeywords = ["bank", "payment", "invoice", "credit card", "refund", "transaction"];

    const verificationKeywords = ["account", "verify", "password", "login"];

    const urgencyWords = ["urgent", "immediately", "now", "asap", "act fast"];

    // Financial scoring
    financialKeywords.forEach((word) => {
        if (text.includes(word)) {
            score += 20;
            reasons.push(`Financial keyword detected: ${word}`);
        }
    });

    // Verification scoring
    verificationKeywords.forEach((word) => {
        if (text.includes(word)) {
            score += 15;
            reasons.push(`Security keyword detected: ${word}`);
        }
    });

    // Urgency scoring
    urgencyWords.forEach((word) => {
        if (text.includes(word)) {
            score += 15;
            reasons.push(`Urgency word detected: ${word}`);
        }
    });

    // URL detection
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

    if (text.match(urlRegex)) {
        score += 20;
        reasons.push("Contains suspicious URL");
    }

    // Scam type detection
    let scamType = "GENERAL";
    let matchedKeywords = [];

    Object.entries(scamCategories).forEach(([category, keywords]) => {
        keywords.forEach((keyword) => {
            if (text.includes(keyword)) {
                matchedKeywords.push(keyword);

                if (scamType === "GENERAL") {
                    scamType = category;
                }
            }
        });
    });

    matchedKeywords = [...new Set(matchedKeywords)];

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
        scamType,
        matchedKeywords,
        reasons,
    };
};

export { analyzeMessage };
