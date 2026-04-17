import SecurityAudit from "../models/securityAudit.model.js";

export const logSecurityEvent = async ({
    userId = null,
    email = "",
    eventType,
    status,
    severity = "low",
    ip = "",
    userAgent = "",
    details = "",
}) => {
    try {
        await SecurityAudit.create({
            userId,
            email,
            eventType,
            status,
            severity,
            ip,
            userAgent,
            details,
        });
    } catch (error) {
        console.error("Security audit logging failed:", error);
    }
};
