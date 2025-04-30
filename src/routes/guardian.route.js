const express = require('express')
const router = express.Router()
const guardianController = require('../controllers/guardian.controller')

// POST /api/guardian
router.post('/', guardianController.saveGuardian)

module.exports = router
