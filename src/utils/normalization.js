/**
 * Common homoglyphs used in phishing attacks (lookalike characters).
 * Maps Greek, Cyrillic, and other characters to their Latin equivalents.
 */
const homoglyphs = {
    а: "a",
    е: "e",
    о: "o",
    р: "p",
    с: "c",
    у: "y",
    х: "x", // Cyrillic
    і: "i",
    ј: "j",
    к: "k",
    м: "m",
    н: "n",
    т: "t", // More Cyrillic
    α: "a",
    β: "b",
    γ: "g",
    δ: "d",
    ε: "e",
    ζ: "z",
    η: "h", // Greek
    θ: "t",
    ι: "i",
    κ: "k",
    λ: "l",
    μ: "m",
    ν: "n",
    ξ: "x",
    ο: "o",
    π: "p",
    ρ: "r",
    σ: "s",
    τ: "t",
    υ: "u",
    φ: "f",
    χ: "x",
    ψ: "p",
    ω: "o",
    í: "i",
    ì: "i",
    ï: "i",
    î: "i",
    é: "e",
    è: "e",
    ê: "e", // Accented
    ö: "o",
    ò: "o",
    ó: "o",
    ô: "o",
    ü: "u",
    ù: "u",
    ú: "u",
    á: "a",
    à: "a",
    â: "a",
    ä: "a",
    ç: "c",
    ñ: "n",
};

/**
 * Normalizes text by removing hidden characters (zero-width spaces, etc.)
 * and converting homoglyphs to standard Latin equivalents.
 *
 * @param {string} text - The input message text.
 * @returns {Object} { normalizedText, isDeceptive }
 */
export const normalizeText = (text = "") => {
    if (typeof text !== "string") return { normalizedText: "", isDeceptive: false };

    // 1. Remove non-printable and zero-width characters
    // \u200B-\u200D: Zero-width space/non-joiner/joiner
    // \uFEFF: Zero-width non-breaking space
    const cleanText = text.replace(/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "");

    let normalizedText = "";
    let isDeceptive = cleanText.length !== text.length; // Already deceptive if hidden chars found

    for (const char of cleanText) {
        if (homoglyphs[char]) {
            normalizedText += homoglyphs[char];
            isDeceptive = true;
        } else {
            normalizedText += char;
        }
    }

    return {
        normalizedText,
        isDeceptive,
        originalLength: text.length,
        normalizedLength: normalizedText.length,
    };
};
