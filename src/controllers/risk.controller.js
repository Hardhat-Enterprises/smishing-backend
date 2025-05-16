// src/controllers/risk.controller.js
import analyzeRisk from "../services/risk.service.js";

export const scanRisk = async (req, res) => {
    try {
        const {
            userId,
            hasVpn,
            isEncrypted,
            permissions,
            clickedLinks,
            has2FA,
            browser,
            installedApps,
            isPlayProtectEnabled
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required.",
            });
        }

        const result = await analyzeRisk(userId, hasVpn, isEncrypted, permissions, clickedLinks, has2FA, browser, installedApps, isPlayProtectEnabled);

        return res.status(200).json({
            success: true,
            message: "Risk analysis complete.",
            data: result,
        });
    } catch (error) {
        console.error("Risk Analysis Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
