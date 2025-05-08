const express = require('express')
const router = express.Router()

// Import the settings controller functions
const {
    getUserSettings,
    updateUserSettings,
} = require('../controllers/userSettings.controller')

// GET /api/settings: Retrieve current user preferences (using dummy user)
router.get('/', getUserSettings)

// PUT /api/settings: Update user preferences (using dummy user)
router.put('/', updateUserSettings)

module.exports = router
