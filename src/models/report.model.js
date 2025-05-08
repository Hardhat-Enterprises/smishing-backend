// src/models/report.model.js
const mongoose = require('mongoose')

// Define the schema for a manually reported message
const reportSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    sender: {
        type: String,
        default: 'Unknown',
    },
    reportedAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('Report', reportSchema)
