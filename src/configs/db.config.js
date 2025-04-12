require('dotenv').config()
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server') // Add this import
let mongoServer

async function connectDB() {
    let uri

    // If NODE_ENV is 'test', use the in-memory MongoDB server
    if (process.env.NODE_ENV === 'test') {
        mongoServer = await MongoMemoryServer.create() // Create the in-memory server
        uri = mongoServer.getUri() // Get the URI for the in-memory MongoDB instance
    } else {
        // Otherwise, use the MONGO_URI from .env
        uri = process.env.MONGO_URI
    }

    try {
        await mongoose.connect(uri)
        console.log('Connected to MongoDB')
    } catch (error) {
        console.error('MongoDB connection error:', error)
        process.exit(1) // Exit if database connection fails
    }
}

module.exports = connectDB
