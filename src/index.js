require('dotenv').config()
const express = require('express')
const connectDB = require('./configs/db.config.js')
const authRoute = require('./routes/auth.route.js')

const app = express()
app.use(express.json())

// ✅ Skip DB connection if running in test mode
if (process.env.NODE_ENV !== 'test') {
    connectDB()
}

// Mount routes
app.use('/api/auth', authRoute)
app.use('/api/dashboard', require('./routes/dashboard.route.js'))

const PORT = process.env.PORT || 3000
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
}

module.exports = app
