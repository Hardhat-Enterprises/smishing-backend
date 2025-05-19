const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI
        if (!uri) throw new Error('MONGODB_URI is not defined')
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log('Connected to MongoDB')
    } catch (error) {
        console.error('MongoDB connection error:', error)
        process.exit(1)
    }
}

module.exports = connectDB

