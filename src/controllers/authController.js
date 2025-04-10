const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Otp = require('../models/otp')
const sendEmail = require('../utils/sendEmail')

// In controllers/authController.js
exports.register = async (req, res) => {
    const { fullName, phoneNumber, email, password } = req.body

    console.log('Register request data:', req.body)

    try {
        const existingUser = await User.findOne({ email })
        if (existingUser)
            return res
                .status(409)
                .json({ success: false, message: 'Email already registered.' })

        // Hash the user's password and store in the database
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({
            fullName,
            phoneNumber,
            email,
            passwordHash: hashedPassword,
        })

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // OTP valid for 10 minutes

        // Save OTP in database
        await Otp.create({ userId: user._id, otpCode, expiresAt })

        // Send OTP to the user's email
        await sendEmail(email, `Your verification OTP is: ${otpCode}`)

        // Respond with success
        res.json({
            success: true,
            message: 'Registration successful. Please verify your email.',
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

// In controllers/authController.js
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body

    try {
        // Find user by email
        const user = await User.findOne({ email })
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: 'User not found.' })

        // Find OTP record
        const otpRecord = await Otp.findOne({
            userId: user._id,
            otpCode: otp,
            isUsed: false,
        })

        // Validate OTP
        if (!otpRecord)
            return res
                .status(400)
                .json({ success: false, message: 'Invalid OTP.' })
        if (otpRecord.expiresAt < new Date())
            return res
                .status(400)
                .json({ success: false, message: 'OTP expired.' })

        // Mark OTP as used
        otpRecord.isUsed = true
        await otpRecord.save()

        // Mark the email as verified
        user.isEmailVerified = true
        await user.save()

        res.json({ success: true, message: 'Email verified successfully.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

exports.login = async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.findOne({ email })
        if (!user)
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                token: null,
            })

        const isMatch = await bcrypt.compare(password, user.passwordHash)
        if (!isMatch)
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                token: null,
            })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        })
        res.json({ success: true, message: 'Login successful', token })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            token: null,
        })
    }
}
