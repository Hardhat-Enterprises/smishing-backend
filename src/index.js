require('dotenv').config()
const express = require('express')
const connectDB = require('./configs/db.config.js')
const authRoute = require('./routes/auth.route.js')
const userRoute = require('./routes/user.route.js')
const riskRoute = require('./routes/risk.route.js')
const verifyRoute = require('./routes/verify.route')

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Mount auth routes at /api/auth
app.use('/api/auth', authRoute)
app.use('/api/users', userRoute)
app.use('/api/risk', riskRoute)
app.use('/api/verify-phone', verifyRoute)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
