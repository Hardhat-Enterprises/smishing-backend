import SecurityAudit from "../models/securityAudit.model.js";
import User from "../models/user.model.js";

export const getSecuritySummary = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [
            failedLoginsToday,
            successfulLoginsToday,
            accountLockoutsToday,
            suspiciousAlertsToday,
            passwordResetsToday,
            lockedAccounts,
            latestIncidents,
        ] = await Promise.all([
            SecurityAudit.countDocuments({
                eventType: "LOGIN_FAILED",
                createdAt: { $gte: startOfToday },
            }),

            SecurityAudit.countDocuments({
                eventType: "LOGIN_SUCCESS",
                createdAt: { $gte: startOfToday },
            }),

            SecurityAudit.countDocuments({
                eventType: "ACCOUNT_LOCKED",
                createdAt: { $gte: startOfToday },
            }),

            SecurityAudit.countDocuments({
                eventType: "SUSPICIOUS_LOGIN_DETECTED",
                createdAt: { $gte: startOfToday },
            }),

            SecurityAudit.countDocuments({
                eventType: "PASSWORD_RESET_SUCCESS",
                createdAt: { $gte: startOfToday },
            }),

            User.countDocuments({
                "security.lockUntil": { $gt: new Date() },
            }),

            SecurityAudit.find({})
                .sort({ createdAt: -1 })
                .limit(10)
                .select("email eventType status severity ip userAgent details createdAt"),
        ]);

        return res.status(200).json({
            success: true,
            summary: {
                failedLoginsToday,
                successfulLoginsToday,
                accountLockoutsToday,
                suspiciousAlertsToday,
                passwordResetsToday,
                lockedAccounts,
            },
            latestIncidents,
        });
    } catch (error) {
        console.error("Admin security summary error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve security summary.",
        });
    }
};
