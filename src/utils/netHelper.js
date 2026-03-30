import dns from "dns/promises";
import tls from "tls";

export async function getDnsSummary(domain, { timeoutMs = 4000 } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const [aRecs, aaaaRecs] = await Promise.allSettled([dns.resolve4(domain), dns.resolve6(domain)]);

        // MX and TXT
        const [mxRecs, txtRecs] = await Promise.allSettled([dns.resolveMx(domain), dns.resolveTxt(domain)]);

        const hasMX = mxRecs.status === "fulfilled" && Array.isArray(mxRecs.value) && mxRecs.value.length > 0;
        const txtRecords = txtRecs.status === "fulfilled" ? txtRecs.value || [] : [];

        return {
            a: aRecs.status === "fulfilled" ? aRecs.value : [],
            aaaa: aaaaRecs.status === "fulfilled" ? aaaaRecs.value : [],
            mx: hasMX ? mxRecs.value : [],
            txt: txtRecords,
            hasMX,
        };
    } catch (e) {
        return { a: [], aaaa: [], mx: [], txt: [], hasMX: undefined, error: e?.message || "DNS error" };
    } finally {
        clearTimeout(timer);
    }
}

/** Quick SSL fetch (no full HTTPS request) */
export async function getSslInfo(domain, { timeoutMs = 5000 } = {}) {
    return new Promise((resolve) => {
        const socket = tls.connect(
            {
                host: domain,
                port: 443,
                servername: domain,
                rejectUnauthorized: false,
            },
            () => {
                try {
                    const cert = socket.getPeerCertificate(true);
                    // If no cert, return minimal info
                    if (!cert || Object.keys(cert).length === 0) {
                        socket.end();
                        return resolve({ available: false });
                    }

                    const notAfter = cert.valid_to ? new Date(cert.valid_to) : null;
                    const issuer = cert.issuer && (cert.issuer.O || cert.issuer.CN || JSON.stringify(cert.issuer));
                    const subject = cert.subject && (cert.subject.CN || JSON.stringify(cert.subject));

                    const now = new Date();
                    const valid =
                        notAfter &&
                        now < notAfter &&
                        // If cert has valid_from:
                        (cert.valid_from ? now >= new Date(cert.valid_from) : true);

                    const expiresInDays = notAfter ? Math.ceil((notAfter - now) / (1000 * 60 * 60 * 24)) : null;

                    socket.end();
                    resolve({
                        available: true,
                        valid: !!valid,
                        issuer: issuer || null,
                        subject: subject || null,
                        expiresOn: notAfter ? notAfter.toISOString() : null,
                        expiresInDays,
                        selfSigned:
                            !!cert.subject &&
                            !!cert.issuer &&
                            JSON.stringify(cert.subject) === JSON.stringify(cert.issuer),
                    });
                } catch (err) {
                    socket.end();
                    resolve({ available: false, error: err?.message || "SSL parse error" });
                }
            },
        );

        socket.setTimeout(timeoutMs, () => {
            try {
                socket.destroy();
            } catch {}
            resolve({ available: false, error: "SSL timeout" });
        });

        socket.on("error", () => {
            // Domain may not support 443/SSL at all
            resolve({ available: false });
        });
    });
}

export async function getBlacklistSummary(domain) {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    const results = await Promise.allSettled([checkGoogleSafeBrowsing(url), checkOpenPhish(url)]);

    return {
        googleSafeBrowsing: results[0].status === "fulfilled" ? results[0].value : null,
        openPhish: results[1].status === "fulfilled" ? results[1].value : null,
    };
}

async function checkGoogleSafeBrowsing(url) {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    if (!apiKey) return null;

    try {
        const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client: {
                    clientId: "smishing-detection",
                    clientVersion: "1.0.0",
                },
                threatInfo: {
                    threatTypes: [
                        "MALWARE",
                        "SOCIAL_ENGINEERING",
                        "UNWANTED_SOFTWARE",
                        "POTENTIALLY_HARMFUL_APPLICATION",
                    ],
                    platformTypes: ["ANY_PLATFORM"],
                    threatEntryTypes: ["URL"],
                    threatEntries: [{ url }],
                },
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.matches && data.matches.length > 0;
    } catch (err) {
        console.error("Google Safe Browsing error:", err.message);
        return null;
    }
}

async function checkOpenPhish(url) {
    try {
        const response = await fetch("https://openphish.com/feed.txt", {
            method: "GET",
        });

        if (!response.ok) return null;
        const text = await response.text();
        const urls = text.split("\n").map((u) => u.trim());
        return urls.includes(url);
    } catch (err) {
        console.error("OpenPhish error:", err.message);
        return null;
    }
}
