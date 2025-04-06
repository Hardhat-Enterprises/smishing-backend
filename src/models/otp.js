const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    otpCode: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    isUsed: { type: Boolean, default: false },
})
module.exports = mongoose.model('Otp', otpSchema)
