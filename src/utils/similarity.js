/**
 * Jaro-Winkler Distance Utility
 * Measures similarity between two strings.
 * Returns a score between 0 (no similarity) and 1 (exact match).
 */

export function jaroWinkler(s1, s2) {
    if (s1 === s2) return 1.0;

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 || len2 === 0) return 0.0;

    // Max distance between characters to be considered a match
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;

    const matches1 = new Array(len1).fill(false);
    const matches2 = new Array(len2).fill(false);

    let commonCharacters = 0;
    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, len2);

        for (let j = start; j < end; j++) {
            if (!matches2[j] && s1[i] === s2[j]) {
                matches1[i] = true;
                matches2[j] = true;
                commonCharacters++;
                break;
            }
        }
    }

    if (commonCharacters === 0) return 0.0;

    // Transpositions
    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < len1; i++) {
        if (matches1[i]) {
            while (!matches2[k]) k++;
            if (s1[i] !== s2[k]) transpositions++;
            k++;
        }
    }

    const jaro = (
        commonCharacters / len1 +
        commonCharacters / len2 +
        (commonCharacters - transpositions / 2) / commonCharacters
    ) / 3;

    // Winkler adjustment
    const prefixLength = getPrefixLength(s1, s2);
    const scalingFactor = 0.1; // Default scaling factor

    return jaro + prefixLength * scalingFactor * (1 - jaro);
}

function getPrefixLength(s1, s2) {
    const maxPrefix = 4;
    let n = Math.min(maxPrefix, Math.min(s1.length, s2.length));
    for (let i = 0; i < n; i++) {
        if (s1[i] !== s2[i]) return i;
    }
    return n;
}
