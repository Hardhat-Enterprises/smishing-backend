const express = require('express')
const router = express.Router()
const { signup, verifyOtp, login } = require('../controllers/auth.controller')

// POST /signup
router.post('/signup', signup)

// POST /verify-otp
router.post('/verify-otp', verifyOtp)

// POST /login
router.post('/login', login)

module.exports = router
