// src/routes/scan.route.js
const express = require('express')
const router = express.Router()

// Predefined list of scam keywords (adjust as needed)
const scamKeywords = [
    'congratulations',
    'bank account locked',
    'claim your prize',
    'urgent action required',
    'click here',
]

// POST /scan: Accept an SMS message and check for scam keywords
router.post('/', (req, res) => {
    const { message, sender } = req.body

    // Validate the input
    if (!message) {
        return res.status(400).json({ error: 'Message is required' })
    }

    // Convert the message to lowercase for case-insensitive matching
    const lowerMessage = message.toLowerCase()
    const matchedKeywords = scamKeywords.filter((keyword) =>
        lowerMessage.includes(keyword)
    )

    // Determine if the message is suspicious
    const suspicious = matchedKeywords.length > 0

    // Return the result
    res.json({
        sender: sender || 'Unknown',
        suspicious,
        matchedKeywords,
    })
})

module.exports = router
