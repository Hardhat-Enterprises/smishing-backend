/**
 * Calculates Shannon Entropy of a string (bits per character).
 * High entropy indicates randomness (e.g., algorithmically generated strings).
 * Legitimate paths (e.g., /orders/view) are low entropy; 
 * malicious paths (e.g., /a1b2c3d4e5f6) are high entropy.
 * 
 * @param {string} str - The string to calculate entropy for.
 * @returns {number} - The Shannon entropy in bits per character.
 */
export function calculateEntropy(str) {
    if (!str || str.length === 0) return 0;
    const len = str.length;
    const frequencies = {};
    for (const char of str) {
        frequencies[char] = (frequencies[char] || 0) + 1;
    }
    let entropy = 0;
    for (const char in frequencies) {
        const p = frequencies[char] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

/**
 * Analyzes the path depth and looks for suspicious extensions.
 * 
 * @param {string} url - The URL to analyze.
 * @returns {Object} - Analysis results including depth and extensions.
 */
export function analyzePath(url) {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const subdirectories = path.split("/").filter(Boolean);
        const depth = subdirectories.length;
        
        const suspiciousExtensions = [".php", ".zip", ".exe", ".msi", ".bat", ".cmd", ".scr", ".pif", ".wsf", ".vbs"];
        const hasSuspiciousExtension = suspiciousExtensions.some(ext => path.toLowerCase().endsWith(ext));
        
        return {
            depth,
            hasSuspiciousExtension,
            pathEntropy: calculateEntropy(path)
        };
    } catch (e) {
        return { depth: 0, hasSuspiciousExtension: false, pathEntropy: 0 };
    }
}

/**
 * TLD risk table mapping Top-Level Domains to risk scores.
 */
export const TLD_RISK_TABLE = {
    ".top": 10,
    ".link": 10,
    ".xyz": 10,
    ".icu": 10,
    ".work": 8,
    ".click": 8,
    ".biz": 7,
    ".info": 5,
    ".gdn": 9,
    ".bid": 9,
    ".loan": 9,
    ".win": 8
};

/**
 * Returns the risk score for a given domain based on its TLD.
 * 
 * @param {string} domain - The domain to check.
 * @returns {number} - The risk score (0-10).
 */
export function getTLDRisk(domain) {
    if (!domain) return 0;
    const parts = domain.split(".");
    if (parts.length < 2) return 0;
    const tld = "." + parts.pop()?.toLowerCase();
    return TLD_RISK_TABLE[tld] || 0;
}

/**
 * Extracts all URLs from a given message text.
 * 
 * @param {string} text - The message text.
 * @returns {string[]} - An array of extracted URLs.
 */
export function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}
