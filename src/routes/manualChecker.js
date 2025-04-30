const express = require('express')
const router = express.Router()

router.post('/check-text', (req, res) => {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'Text is required' })

    const reasons = []
    const patterns = [
        { regex: /urgent|act now|immediately/i, reason: 'Uses urgency' },
        {
            regex: /congratulations|won|gift/i,
            reason: 'Mentions reward or prize',
        },
        {
            regex: /http:\/\/|https:\/\/|bit\.ly|tinyurl/i,
            reason: 'Contains suspicious link',
        },
        { regex: /otp|one[-\s]?time[-\s]?password/i, reason: 'Requests OTP' },
        { regex: /bank|account|pin|cvv/i, reason: 'Requests sensitive info' },
    ]

    patterns.forEach((p) => {
        if (p.regex.test(text)) reasons.push(p.reason)
    })

    res.json({
        isSuspicious: reasons.length > 0,
        reasons: reasons.length ? reasons : ['No suspicious patterns found'],
    })
})

module.exports = router
