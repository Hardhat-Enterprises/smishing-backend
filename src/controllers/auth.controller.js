const User = require('../models/user.model')
const {
    hashPassword,
    comparePassword,
    generateToken,
} = require('../utils/token.util')
const { sendWelcomeEmail } = require('../services/email.service')
const { sendSms } = require('../services/sms.service')
const crypto = require('crypto')

/**
 * POST /api/auth/signup
 * Registers a new user and sends an OTP via SMS for phone verification
 */
exports.signup = async (req, res) => {
    try {
        const { fullName, phoneNumber, email, password } = req.body

        if (!fullName || !phoneNumber || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    'All fields (fullName, phoneNumber, email, password) are required.',
            })
        }

        // Check if user/email already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered.',
            })
        }

        // Hash the password
        const passwordHash = await hashPassword(password)

        // Create user instance
        const newUser = new User({
            fullName,
            phoneNumber,
            email,
            passwordHash,
            isPhoneVerified: false, // OTP flow
        })

        // Generate a 6-digit OTP and hash it
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex')

        // Set OTP and expiry on user document
        newUser.phoneVerificationCode = hashedOtp
        newUser.phoneVerificationExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

        // Save the new user record
        await newUser.save()

        // Send OTP via SMS
        sendSms(newUser.phoneNumber, `Your verification code is: ${otp}`)
            .then(() => console.log('OTP SMS sent successfully'))
            .catch((err) => console.error('Error sending OTP SMS:', err))

        // Optionally send welcome email
        sendWelcomeEmail(email, fullName)
            .then(() => console.log('Welcome email sent successfully'))
            .catch((err) => console.error('Error sending welcome email:', err))

        return res.status(201).json({
            success: true,
            message: 'User registered. Verification code sent via SMS.',
        })
    } catch (error) {
        // Log the full stack so you can see exactly what went wrong
        console.error('Error in signup:', error.stack || error)

        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        })
    }
}

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.',
            })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email.',
            })
        }

        const isMatch = await comparePassword(password, user.passwordHash)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.',
            })
        }

        // Generate a JWT
        const token = generateToken({ userId: user._id })

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
        })
    } catch (error) {
        console.error('Error in login:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        })
    }
}
