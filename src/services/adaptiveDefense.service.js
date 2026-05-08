import BlockedIp from "../models/blockedIp.model.js";
import SecurityAudit from "../models/securityAudit.model.js";
import { logSecurityEvent } from "./securityAudit.service.js";

const IP_FAILED_ATTEMPT_THRESHOLD = Number(process.env.IP_FAILED_ATTEMPT_THRESHOLD || 10);
const IP_BLOCK_MINUTES = Number(process.env.IP_BLOCK_MINUTES || 15);
const ADAPTIVE_LOCK_THRESHOLD = Number(process.env.ADAPTIVE_LOCK_THRESHOLD || 3);

export const isIpBlocked = async (ip) => {
    if (!ip) return false;

    const blockedIp = await BlockedIp.findOne({
        ip,
        blockedUntil: { $gt: new Date() },
    });

    return Boolean(blockedIp);
};

export const recordFailedIpAttempt = async ({ ip, email = "", userId = null, userAgent = "" }) => {
    if (!ip) return null;

    let record = await BlockedIp.findOne({ ip });

    if (!record) {
        record = await BlockedIp.create({
            ip,
            failedAttempts: 1,
            reason: "Repeated failed login attempts detected.",
            blockedUntil: new Date(0),
        });
    } else {
        record.failedAttempts = (record.failedAttempts || 0) + 1;
    }

    if (record.failedAttempts >= IP_FAILED_ATTEMPT_THRESHOLD) {
        record.blockedUntil = new Date(Date.now() + IP_BLOCK_MINUTES * 60 * 1000);
        record.reason = "IP blocked due to repeated failed login attempts.";
        await record.save();

        await logSecurityEvent({
            userId,
            email,
            eventType: "IP_BLOCKED",
            status: "warning",
            severity: "high",
            ip,
            userAgent,
            details: `IP blocked after ${record.failedAttempts} failed login attempts. Blocked until ${record.blockedUntil.toISOString()}.`,
        });

        return record;
    }

    await record.save();
    return record;
};

export const shouldTriggerAdaptiveLock = async ({ email, ip = "", userAgent = "", userId = null }) => {
    if (!email) return false;

    const since = new Date(Date.now() - 30 * 60 * 1000);

    const suspiciousEvents = await SecurityAudit.countDocuments({
        email,
        eventType: "SUSPICIOUS_LOGIN_DETECTED",
        createdAt: { $gte: since },
    });

    const shouldLock = suspiciousEvents >= ADAPTIVE_LOCK_THRESHOLD;

    if (shouldLock) {
        await logSecurityEvent({
            userId,
            email,
            eventType: "ADAPTIVE_LOCK_TRIGGERED",
            status: "warning",
            severity: "high",
            ip,
            userAgent,
            details: `Adaptive lock triggered after ${suspiciousEvents} suspicious login detection events.`,
        });
    }

    return shouldLock;
};
