require('dotenv').config();
const express = require('express');
const connectDB = require('./configs/db.config.js');
const authRoute = require('./routes/auth.route.js');
const guardianRoute = require('./routes/guardian.route');
const manualChecker = require('./routes/manualChecker');

const app = express();
app.use(express.json());

const guardianRoute = require('./routes/guardian.route')
app.use('/api/guardian', guardianRoute)

const manualChecker = require('./routes/manualChecker')
app.use('/api', manualChecker) // add after express setup

// Connect to MongoDB
connectDB();

// Mount auth routes at /api/auth
app.use("/api/auth", authRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
