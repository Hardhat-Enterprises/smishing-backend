const express = require('express')
const dotenv = require('dotenv')
const connectDB = require('./configs/db')
const authRoutes = require('./routes/authRoutes')
const rateLimit = require('express-rate-limit')
const cors = require('cors')

dotenv.config()
connectDB()

const app = express()

// Replace your current cors configuration with this

app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.originalUrl)
    console.log('Request headers:', req.headers)
    next()
})

app.use(express.json())

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
})
//app.use(limiter);

app.use('/api', authRoutes)

const PORT = 3000

// Correct the listening address to '0.0.0.0' as a string.
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
})
