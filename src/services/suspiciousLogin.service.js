import SecurityAudit from "../models/securityAudit.model.js";
import { logSecurityEvent } from "./securityAudit.service.js";
import { sendEmail } from "./email.service.js";

const FAILED_LOGIN_THRESHOLD = Number(process.env.SUSPICIOUS_LOGIN_THRESHOLD || 5);
const TIME_WINDOW_MINUTES = Number(process.env.SUSPICIOUS_LOGIN_WINDOW_MINUTES || 5);
const ALERT_COOLDOWN_MINUTES = Number(process.env.SUSPICIOUS_LOGIN_ALERT_COOLDOWN_MINUTES || 30);

export const detectSuspiciousLoginActivity = async ({ userId = null, email, ip = "", userAgent = "" }) => {
    try {
        if (!email) return false;

        const since = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000);
        const cooldownSince = new Date(Date.now() - ALERT_COOLDOWN_MINUTES * 60 * 1000);

        const failedAttempts = await SecurityAudit.countDocuments({
            email,
            eventType: "LOGIN_FAILED",
            status: "failure",
            createdAt: { $gte: since },
        });

        if (failedAttempts < FAILED_LOGIN_THRESHOLD) {
            return false;
        }

        const recentAlert = await SecurityAudit.findOne({
            email,
            eventType: "SUSPICIOUS_LOGIN_DETECTED",
            createdAt: { $gte: cooldownSince },
        });

        if (recentAlert) {
            return false;
        }

        await logSecurityEvent({
            userId,
            email,
            eventType: "SUSPICIOUS_LOGIN_DETECTED",
            status: "warning",
            severity: "high",
            ip,
            userAgent,
            details: `${failedAttempts} failed login attempts detected within ${TIME_WINDOW_MINUTES} minutes.`,
        });

        const body = `We detected suspicious login activity on your account.

Multiple failed login attempts were recorded within a short period.

Details:
Time: ${new Date().toISOString()}
IP Address: ${ip}

If this was not you, we recommend resetting your password immediately.`;

        await sendEmail(email, body);

        await logSecurityEvent({
            userId,
            email,
            eventType: "SUSPICIOUS_LOGIN_ALERT_SENT",
            status: "success",
            severity: "high",
            ip,
            userAgent,
            details: "Suspicious login alert email sent to user.",
        });

        return true;
    } catch (error) {
        console.error("Suspicious login detection failed:", error);
        return false;
    }
};
