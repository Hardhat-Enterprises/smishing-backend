const mongoose = require('mongoose')

const guardianSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Assuming you have a User model
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        contactType: {
            type: String,
            enum: ['email', 'phone'],
            required: true,
        },
        contactValue: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Guardian', guardianSchema)
