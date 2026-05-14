const analyzeMessage = async (message) => {
    const text = message.toLowerCase();

    let score = 0;
    let reasons = [];

    // Scam categories with keyword mapping
    const scamCategories = {
        "BANKING PHISHING": [
            "bank",
            "account",
            "login",
            "verify",
            "password",
            "transaction",
            "credit card",
            "payment",
            "refund",
            "billing",
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

        "LOTTERY SCAM": ["lottery", "winner", "jackpot", "claim prize", "cash reward", "congratulations"],

        "JOB SCAM": ["job offer", "work from home", "earn money", "salary", "interview", "part time"],

        "OTP SCAM": ["otp", "verification code", "security code", "authentication", "your otp is"],

        "INVESTMENT SCAM": ["investment", "crypto", "bitcoin", "returns", "profit", "trading"],

        "LOAN SCAM": ["loan approved", "instant loan", "low interest", "emi", "credit limit"],

        "SOCIAL MEDIA SCAM": ["instagram", "facebook", "whatsapp", "telegram", "social media"],

        "URGENT ACTION SCAM": ["urgent", "immediately", "act now", "limited time", "asap", "now"],

        "ACCOUNT VERIFICATION SCAM": [
            "verify account",
            "confirm identity",
            "login immediately",
            "suspended account",
            "account blocked",
        ],

        "QR CODE SCAM": ["scan qr", "qr code", "payment qr", "upi collect", "scan and pay"],

        "SIM SWAP SCAM": ["sim blocked", "sim upgrade", "network issue", "replace sim", "sim verification"],

        "TAX SCAM": ["tax refund", "ato refund", "tax payment", "government refund", "pending tax"],

        "CHARITY SCAM": ["donate now", "charity", "fundraiser", "help victims", "emergency donation"],

        "INSURANCE SCAM": [
            "insurance claim",
            "policy expired",
            "renew insurance",
            "claim settlement",
            "premium payment",
        ],

        "CRYPTO SCAM": ["crypto wallet", "binance", "coinbase", "btc", "eth"],

        "ROMANCE SCAM": ["miss you", "love you", "relationship", "send money", "trust me"],

        "TECH SUPPORT SCAM": [
            "technical support",
            "virus detected",
            "device hacked",
            "call support",
            "microsoft support",
        ],

        "SUBSCRIPTION SCAM": ["subscription expired", "renew now", "netflix", "spotify", "prime membership"],

        "SCHOLARSHIP SCAM": [
            "scholarship approved",
            "education grant",
            "student benefit",
            "tuition support",
            "study fund",
        ],

        "E-COMMERCE SCAM": ["amazon", "flipkart", "ebay", "order cancelled", "online shopping"],

        "TRAVEL SCAM": ["flight booking", "travel offer", "hotel booking", "vacation package", "cheap tickets"],

        "MONEY TRANSFER SCAM": ["wire transfer", "send money", "bank transfer", "western union", "moneygram"],

        "FAKE INVOICE SCAM": [
            "invoice attached",
            "pending invoice",
            "payment due",
            "billing notice",
            "overdue payment",
        ],

        "REWARD POINT SCAM": ["reward points", "redeem now", "bonus points", "loyalty reward", "claim rewards"],

        "FAKE CUSTOMER CARE SCAM": ["customer support", "helpline", "support executive", "service center", "call now"],

        "REMOTE ACCESS SCAM": ["anydesk", "teamviewer", "remote access", "screen share", "install app"],

        "KYC UPDATE SCAM": ["kyc update", "update kyc", "kyc pending", "complete kyc", "reverify kyc"],

        "UPI PAYMENT SCAM": ["upi", "gpay", "phonepe", "paytm", "upi id"],

        "FAKE RECRUITMENT SCAM": [
            "hiring now",
            "selection confirmed",
            "job confirmation",
            "recruitment process",
            "offer letter",
        ],
    };

    // Store matched categories
    let scamTypes = [];

    // Store matched keywords
    let matchedKeywords = [];

    // Detect scam categories
    Object.entries(scamCategories).forEach(([category, keywords]) => {
        let categoryMatched = false;

        keywords.forEach((keyword) => {
            if (text.includes(keyword)) {
                matchedKeywords.push(keyword);

                categoryMatched = true;

                score += 10;

                reasons.push(`Detected keyword: ${keyword}`);
            }
        });

        if (categoryMatched) {
            scamTypes.push(category);
        }
    });

    // URL detection
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

    const urls = text.match(urlRegex);

    if (urls && urls.length > 0) {
        score += 20;

        reasons.push("Contains suspicious URL");

        scamTypes.push("URL PHISHING");
    }

    // URL shortener detection
    const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl"];

    const hasShortener = urls?.some((url) => shorteners.some((shortener) => url.includes(shortener)));

    if (hasShortener) {
        score += 25;

        reasons.push("Contains shortened URL");

        scamTypes.push("SHORTENED URL SCAM");
    }

    // Remove duplicates
    scamTypes = [...new Set(scamTypes)];

    matchedKeywords = [...new Set(matchedKeywords)];

    reasons = [...new Set(reasons)];

    // Default category
    if (scamTypes.length === 0) {
        scamTypes.push("SAFE / UNKNOWN");
    }

    // Risk classification
    let riskLevel = "LOW";

    if (score >= 80) {
        riskLevel = "HIGH";
    } else if (score >= 40) {
        riskLevel = "MEDIUM";
    }

    return {
        message,

        score,

        riskLevel,

        scamTypes,

        matchedKeywords,

        reasons,
    };
};

export { analyzeMessage };
