import crypto from "crypto";

// In-memory store for tracking malicious scans
// In a production environment, this should ideally be Redis
const fingerprintStore = new Map();

// Configuration
const MALICIOUS_THRESHOLD = 10; // Max malicious scans allowed within the window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const BAN_DURATION_MS = 60 * 60 * 1000; // 1 hour shadow ban

/**
 * Middleware to fingerprint client devices based on stable HTTP headers.
 * This allows tracking bots even if they rotate their IP address.
 */
export const fingerprintMiddleware = (req, res, next) => {
    const userAgent = req.headers["user-agent"] || "";
    const acceptLanguage = req.headers["accept-language"] || "";
    const secChUa = req.headers["sec-ch-ua"] || "";
    const acceptEncoding = req.headers["accept-encoding"] || "";

    // Create a unique fingerprint by hashing stable headers
    const fingerprintString = `${userAgent}|${acceptLanguage}|${secChUa}|${acceptEncoding}`;
    const fingerprint = crypto
        .createHash("sha256")
        .update(fingerprintString)
        .digest("hex");

    req.fingerprint = fingerprint;

    const now = Date.now();
    let clientData = fingerprintStore.get(fingerprint);

    if (!clientData) {
        clientData = { counts: [], shadowBannedUntil: 0 };
        fingerprintStore.set(fingerprint, clientData);
    }

    // Clean up old timestamps outside the sliding window
    clientData.counts = clientData.counts.filter(timestamp => now - timestamp < WINDOW_MS);

    // Check if client is currently shadow banned
    if (clientData.shadowBannedUntil > now) {
        return res.status(429).json({
            detail: "Too many suspicious scan attempts. Access restricted.",
            fingerprint: req.fingerprint // Included for verification purposes
        });
    }

    next();
};

/**
 * Tracks a scan result for a given fingerprint.
 * If the scan is determined to be malicious (smishing), it increments the counter.
 * 
 * @param {string} fingerprint - The client's fingerprint.
 * @param {string} prediction - The prediction result ('smishing' or 'ham').
 */
export const trackScanResult = (fingerprint, prediction) => {
    if (!fingerprint || prediction !== "smishing") return;

    const now = Date.now();
    let clientData = fingerprintStore.get(fingerprint);

    if (!clientData) {
        clientData = { counts: [], shadowBannedUntil: 0 };
        fingerprintStore.set(fingerprint, clientData);
    }

    clientData.counts.push(now);

    // If threshold reached, apply shadow ban
    if (clientData.counts.length >= MALICIOUS_THRESHOLD) {
        clientData.shadowBannedUntil = now + BAN_DURATION_MS;
    }
};
