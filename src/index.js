require('dotenv').config()
const express = require('express')
const connectDB = require('./configs/db.config.js')
const authRoute = require('./routes/auth.route.js')

const app = express()
app.use(express.json())

// Connect to MongoDB
connectDB()

// Mount auth routes at /api/auth
app.use('/api/auth', authRoute)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

module.exports = app
