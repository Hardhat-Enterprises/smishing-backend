require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const connectDB = require('./configs/db.config.js')
const authRoute = require('./routes/auth.route.js')
const newsRoute = require('./routes/news.routes.js') // NEW: Import news routes

const app = express()

// Security Middlewares
app.use(helmet())
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    })
)

app.use(express.json())

// Connect to MongoDB
connectDB()

// Mount auth routes at /api/auth
app.use('/api/auth', authRoute)
app.use('/api/news', newsRoute) // NEW: Mount news routes at /api/news

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found' })
})

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

module.exports = app
