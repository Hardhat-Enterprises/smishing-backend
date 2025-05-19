const mongoose = require('mongoose')

const detectionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: String,
    prediction: String, // e.g., 'smishing' or 'safe'
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Detection', detectionSchema)
