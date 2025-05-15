const checkLinkSafety = (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            status: "error",
            message: "URL is required",
        });
    }

    const suspiciousKeywords = ["login", "free", "win", "click", "offer"];
    const isSuspicious = suspiciousKeywords.some((keyword) => url.toLowerCase().includes(keyword));

    const response = {
        status: isSuspicious ? "suspicious" : "safe",
        risk_level: isSuspicious ? "high" : "low",
        message: isSuspicious
            ? "The URL contains suspicious keywords commonly used in phishing."
            : "The URL appears to be safe based on keyword analysis.",
    };

    return res.status(200).json(response);
};

module.exports = { checkLinkSafety };
