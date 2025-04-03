require('dotenv').config()
const express = require('express')
const connectDB = require('./configs/db.config.js')
const authRoute = require('./routes/auth.route.js')
const spamRoute = require('./routes/spam.route.js')

// calling body-parser to handle the Request Object from POST requests
var bodyParser = require('body-parser')

const app = express()
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Connect to MongoDB
connectDB()

// Mount auth routes at /api/auth
app.use('/api/auth', authRoute)

// Mount spam routes at /api/spam
app.use('/api/spam', spamRoute)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

module.exports = app
