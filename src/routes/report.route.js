// src/routes/report.route.js
const express = require('express')
const router = express.Router()
const Report = require('../models/report.model')

// POST /api/report
// Allows a user to manually report a suspicious message
router.post('/', async (req, res) => {
    try {
        const { message, sender } = req.body

        // Basic validation
        if (!message) {
            return res.status(400).json({ error: 'Message is required.' })
        }

        // Create a new report
        const newReport = new Report({
            message,
            sender: sender || 'Unknown',
        })

        // Save to the database
        await newReport.save()

        // Return success response
        return res.status(201).json({
            success: true,
            data: newReport,
        })
    } catch (err) {
        console.error('Error creating report:', err.message)
        return res.status(500).json({
            success: false,
            error: err.message,
        })
    }
})

module.exports = router
