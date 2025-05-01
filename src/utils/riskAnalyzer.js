// src/utils/riskAnalyzer.js

/**
 * Analyze a text message and return a risk score with details.
 *
 * @param {string} message - The message text to analyze.
 * @returns {object} - Contains a risk score and an array of triggered reasons.
 */
function analyzeMessage(message) {
    if (!message || typeof message !== 'string') {
        throw new Error('A valid message string must be provided.')
    }

    // Convert the message to lowercase
    const msg = message.toLowerCase()

    // Define suspicious keywords and their respective weight values.
    const suspiciousKeywords = {
        win: 10,
        prize: 8,
        click: 5,
        urgent: 7,
        bank: 6,
        // We can add more keywords and adjust their weight
    }

    let riskScore = 0
    const triggeredReasons = []

    // Loop through each keyword and check if it occurs in the message.
    for (const [keyword, weight] of Object.entries(suspiciousKeywords)) {
        if (msg.includes(keyword)) {
            riskScore += weight
            triggeredReasons.push(`Found keyword: "${keyword}"`)
        }
    }

    // Normalize or cap the risk score if needed.
    // For example, cap the risk score to 100:
    if (riskScore > 100) {
        riskScore = 100
    }

    // Alternatively, you might want to map the accumulated score to a scale,
    // e.g., if max sum is 100 then riskScore remains as is.

    return {
        riskScore,
        reasons: triggeredReasons,
    }
}

module.exports = { analyzeMessage }
