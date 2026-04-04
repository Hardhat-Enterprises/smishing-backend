import { normalizeText } from "../utils/normalization.js";

/**
 * Redaction patterns for PII (Personally Identifiable Information).
 * Uses robust regex for Phone Numbers, Emails, Credit Cards, SSNs, and Dates of Birth.
 */
const PII_PATTERNS = [
    { type: "EMAIL", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { type: "PHONE", regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g },
    { type: "CREDIT_CARD", regex: /(?:\d{4}[-.\s]?){2,3}\d{4}/g }, // Catches 12 and 16 digit variants
    { type: "SSN", regex: /\d{3}-\d{2}-\d{4}/g },
    { type: "ACCOUNT_NUMBER", regex: /\b\d{8,12}\b/g },
    { type: "FULL_NAME_GREETING", regex: /(?:Hi|Hello|Dear|Hey)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g },
];

/**
 * Scrubs PII from a message string by replacing it with placeholders.
 * Ensures the smishing pattern is preserved while privacy is protected.
 *
 * @param {string} text - The input message text.
 * @returns {string} - Redacted/Scrubbed message text.
 */
export const scrubPii = (text = "") => {
    if (typeof text !== "string") return "";

    // Normalize homoglyphs first so PII regex can match them
    const { normalizedText } = normalizeText(text);
    let scrubbedText = normalizedText;

    for (const pattern of PII_PATTERNS) {
        scrubbedText = scrubbedText.replace(pattern.regex, (match) => {
            return `[${pattern.type}]`;
        });
    }

    return scrubbedText;
};

/**
 * Wrapper for report documents to ensure all metadata is also clean.
 *
 * @param {Object} data - The report data object.
 * @returns {Object} - Cleaned report data object.
 */
export const anonymizeReportData = (data = {}) => {
    const cleanData = { ...data };

    if (cleanData.messageText) {
        cleanData.messageText = scrubPii(cleanData.messageText);
    }

    if (cleanData.messageContent) {
        cleanData.messageContent = scrubPii(cleanData.messageContent);
    }

    // Mask the phone number partially for reports
    if (cleanData.phoneNumber && cleanData.phoneNumber.length > 5) {
        const len = cleanData.phoneNumber.length;
        cleanData.phoneNumber =
            cleanData.phoneNumber.substring(0, 3) + "****" + cleanData.phoneNumber.substring(len - 2);
    }

    return cleanData;
};
