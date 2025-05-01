const crypto = require('crypto')
const User = require('../models/user.model')

exports.verifyPhone = async (req, res) => {
    const { phoneNumber, code } = req.body
    if (!phoneNumber || !code) {
        return res
            .status(400)
            .json({ success: false, message: 'Phone and code required.' })
    }

    // 1. Find user by phone
    const user = await User.findOne({ phoneNumber })
    if (!user) {
        return res
            .status(404)
            .json({ success: false, message: 'User not found.' })
    }

    // 2. Check expiry
    if (Date.now() > user.phoneVerificationExpires) {
        return res
            .status(410)
            .json({ success: false, message: 'Code expired.' })
    }

    // 3. Hash provided code and compare
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    if (hash !== user.phoneVerificationCode) {
        return res
            .status(401)
            .json({ success: false, message: 'Invalid code.' })
    }

    // 4. Mark as verified, clear OTP fields
    user.isPhoneVerified = true
    user.phoneVerificationCode = undefined
    user.phoneVerificationExpires = undefined
    await user.save()

    return res
        .status(200)
        .json({ success: true, message: 'Phone number verified.' })
}
