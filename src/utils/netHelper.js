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

/** (Optional) Blacklist checks — stubs that return null unless configured */
export async function getBlacklistSummary(domain) {
    // You can wire Google Safe Browsing, PhishTank, etc. here.
    // Return booleans; keep null if not configured to avoid false signals.
    return {
        googleSafeBrowsing: null, // true/false/null
        phishTank: null, // true/false/null
    };
}
