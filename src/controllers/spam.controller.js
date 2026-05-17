/**
 * POST /api/textChecker
 */
const checkSpamMessage = async (req, res) => {
    try {
        const { message } = req.body

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message must be provided.',
            })
        }

        // Use the helper function to check for suspicious content
        const { isSuspicious, reason } = checkSuspiciousMessage(message)

        // TODO: Integrate with AI model here when ready
        // const aiResult = await aiModel.checkMessage(message);
        // Then combine aiResult with the current check if needed.

        return res.status(200).json({
            success: true,
            message: 'Check completed successfully.',
            messageIsSpam: isSuspicious,
            reason: reason,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        })
    }
}

const suspiciousPatterns = {
    // Dictionary of suspicious keywords and phrases
    keywords: [
        'free',
        'win',
        'prize',
        'urgent',
        'limited time',
        'click here',
        'verify',
        'account suspended',
        'password reset',
        'bank details',
        'social security',
        'lottery',
        'inheritance',
        'unclaimed funds',
        'investment opportunity',
        'make money',
        'guaranteed',
        'no risk',
        'act now',
        'exclusive offer',
    ],
    // Common scam email domains or patterns
    emailDomains: ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com'],
    // Common URL patterns
    urlPatterns: [
        'http://',
        'https://',
        '.com',
        '.net',
        '.org',
        '.info',
        'bit.ly',
        'tinyurl.com',
    ],
}

const checkSuspiciousMessage = (message) => {
    if (!message || typeof message !== 'string') {
        return {
            isSuspicious: false,
            reason: 'Invalid or missing message.',
        }
    }

    const lowerCaseMessage = message.toLowerCase().trim()

    // 1. Check for suspicious keywords
    const keywordMatch = suspiciousPatterns.keywords.some((keyword) =>
        lowerCaseMessage.includes(keyword)
    )

    // 2. Check for excessive use of special characters (e.g., !, $, #)
    const specialCharRegex = /[!#$%^&*()+={}\[\]|\\:;"'<>?,/]{3,}/
    const hasExcessiveSpecialChars = specialCharRegex.test(lowerCaseMessage)

    // 3. Check for potential URLs or links
    const hasURL = suspiciousPatterns.urlPatterns.some((pattern) =>
        lowerCaseMessage.includes(pattern)
    )

    // 4. Check for email-like patterns
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    const hasEmail = emailRegex.test(lowerCaseMessage)

    // 5. Check for urgency or fear-based phrases
    const urgencyRegex = /\b(urgent|immediate|now|today|asap|last chance)\b/i
    const hasUrgency = urgencyRegex.test(lowerCaseMessage)

    // Aggregate findings
    const isSuspicious =
        keywordMatch ||
        hasExcessiveSpecialChars ||
        hasURL ||
        hasEmail ||
        hasUrgency

    let reasons = []
    if (keywordMatch) reasons.push('Contains suspicious keywords')
    if (hasExcessiveSpecialChars)
        reasons.push('Excessive use of special characters')
    if (hasURL) reasons.push('Contains potential URLs')
    if (hasEmail) reasons.push('Contains email-like pattern')
    if (hasUrgency) reasons.push('Contains urgency phrases')

    return {
        isSuspicious,
        reason:
            reasons.length > 0
                ? reasons.join('; ')
                : 'No suspicious patterns found.',
    }
}

export default {
    checkSpamMessage
};
