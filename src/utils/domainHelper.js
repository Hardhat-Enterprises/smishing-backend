/** ------------ Date helpers ------------ **/
export function safeDate(dateString) {
    return dateString ? new Date(dateString) : null;
}

export function calculateAge(createdDate) {
    if (!createdDate) return null;
    const diff = Math.abs(new Date() - createdDate);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** ------------ WHOIS-derived signals ------------ **/
export function isRiskyTLD(domain) {
    const riskyTLDs = ["xyz", "top", "club", "ru", "cn"];
    const tld = domain?.split(".").pop()?.toLowerCase();
    return !!tld && riskyTLDs.includes(tld);
}

export function hasPrivacyProtection(email) {
    if (!email) return false;
    const e = String(email).toLowerCase();
    return e.includes("privacy") || e.includes("whoisguard");
}

/** ------------ DNS parsing helpers ------------ **/
export function parseTxtForSPF_DMARC(txtRecords = []) {
    const allTxt = txtRecords
        .map((r) => (r.join ? r.join("") : r))
        .join(" ")
        .toLowerCase();
    const hasSPF = allTxt.includes("v=spf1");
    const hasDMARC = allTxt.includes("v=dmarc1");
    return { hasSPF, hasDMARC };
}

/** ------------ SSL helpers ------------ **/
export function daysUntil(date) {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** ------------ Risk model ------------ **/
export function computeRiskScore({
    ageInDays,
    isRisky,
    hasPrivacy,
    registrar,
    domainStatus = [],
    dns = { hasMX: undefined, hasSPF: undefined, hasDMARC: undefined },
    ssl = { valid: undefined, expiresInDays: undefined },
    blacklist = {},
}) {
    let score = 0;

    // Original weights
    if (ageInDays !== null && ageInDays < 30) score += 40;
    if (isRisky) score += 30;
    if (hasPrivacy) score += 20;
    if (!registrar || registrar === "Unknown") score += 10;

    const statusSet = new Set(domainStatus.map((s) => String(s).toLowerCase()));
    if (statusSet.has("clienthold") || statusSet.has("redemptionperiod") || statusSet.has("pendingdelete")) {
        score += 20; // Suspicious/suspended states
    }

    if (dns.hasMX === false) score += 10;
    if (dns.hasSPF === false) score += 5;
    if (dns.hasDMARC === false) score += 5;

    if (ssl.valid === false) score += 15;
    if (ssl.expiresInDays !== null && ssl.expiresInDays <= 0) score += 15;

    for (const k of Object.keys(blacklist)) {
        if (blacklist[k] === true) score += 25;
    }

    return Math.min(score, 100);
}
