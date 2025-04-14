const express = require('express')
const router = express.Router()
const spamController = require('../controllers/spam.controller')

// POST /textChecker
router.post('/textChecker', spamController.checkSpamMessage)

module.exports = router
