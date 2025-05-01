const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true, // ensure one account per number
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },

        // OTP verification fields
        isPhoneVerified: {
            type: Boolean,
            default: false,
        },
        phoneVerificationCode: {
            type: String, // store the hashed OTP
        },
        phoneVerificationExpires: {
            type: Date, // timestamp when the OTP expires
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
