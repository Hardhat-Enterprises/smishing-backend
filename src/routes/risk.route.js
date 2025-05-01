// src/routes/risk.route.js

const express = require('express')
const router = express.Router()
const riskController = require('../controllers/risk.controller')

// POST /api/risk - Analyze the risk of a message.
router.post('/', riskController.analyzeRisk)

module.exports = router
