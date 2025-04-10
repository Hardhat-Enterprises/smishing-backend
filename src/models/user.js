// In models/User.js
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        fullName: String,
        phoneNumber: String,
        email: { type: String, unique: true },
        passwordHash: String,
        isEmailVerified: { type: Boolean, default: false }, // Track if the email is verified
    },
    { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
